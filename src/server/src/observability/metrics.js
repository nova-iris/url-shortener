/**
 * Prometheus Metrics Module
 * Implements application metrics for monitoring and alerting
 */
const { register, collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');

// Collect default Node.js metrics with application prefix
collectDefaultMetrics({ prefix: 'urlshortener_' });

// HTTP Request Metrics
const httpRequestsTotal = new Counter({
    name: 'urlshortener_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
    name: 'urlshortener_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpActiveConnections = new Gauge({
    name: 'urlshortener_http_active_connections',
    help: 'Number of active HTTP connections'
});

const httpRequestSize = new Histogram({
    name: 'urlshortener_http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
});

const httpResponseSize = new Histogram({
    name: 'urlshortener_http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
});

// Database Metrics
const dbQueryDuration = new Histogram({
    name: 'urlshortener_db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

const dbQueriesTotal = new Counter({
    name: 'urlshortener_db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table', 'status']
});

const dbConnectionsActive = new Gauge({
    name: 'urlshortener_db_connections_active',
    help: 'Number of active database connections'
});

const dbConnectionPoolSize = new Gauge({
    name: 'urlshortener_db_connection_pool_size',
    help: 'Database connection pool size'
});

// Business Metrics
const urlsShortenedTotal = new Counter({
    name: 'urlshortener_urls_shortened_total',
    help: 'Total number of URLs shortened',
    labelNames: ['type'] // 'custom' or 'auto'
});

const redirectsTotal = new Counter({
    name: 'urlshortener_redirects_total',
    help: 'Total number of redirects served',
    labelNames: ['status'] // 'success' or 'not_found'
});

const shortIdCollisions = new Counter({
    name: 'urlshortener_short_id_collisions_total',
    help: 'Total number of short ID generation collisions'
});

const urlValidationErrors = new Counter({
    name: 'urlshortener_url_validation_errors_total',
    help: 'Total number of URL validation errors',
    labelNames: ['reason'] // 'invalid_format', 'missing_url', etc.
});

// Error Metrics
const errorsTotal = new Counter({
    name: 'urlshortener_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'status_code']
});

/**
 * Normalize route path for metrics labels
 * Replaces dynamic path parameters with placeholders
 */
const normalizeRoute = (req) => {
    // Use matched route if available, otherwise use path
    if (req.route?.path) {
        return req.route.path;
    }
    
    // Normalize common patterns
    const path = req.path;
    
    // Match URL codes (alphanumeric with dashes/underscores, 4-20 chars)
    if (/^\/[a-zA-Z0-9_-]{4,20}$/.test(path)) {
        return '/:code';
    }
    
    return path;
};

/**
 * Express middleware for tracking HTTP metrics
 */
const metricsMiddleware = (req, res, next) => {
    // Skip metrics endpoint itself to avoid recursion
    if (req.path === '/metrics') {
        return next();
    }

    httpActiveConnections.inc();
    const endTimer = httpRequestDuration.startTimer();
    
    // Track request size
    const requestSize = parseInt(req.get('content-length')) || 0;
    
    res.on('finish', () => {
        const route = normalizeRoute(req);
        const labels = {
            method: req.method,
            route: route,
            status_code: res.statusCode.toString()
        };

        httpRequestsTotal.inc(labels);
        endTimer(labels);
        httpActiveConnections.dec();
        
        // Track request/response sizes
        if (requestSize > 0) {
            httpRequestSize.observe({ method: req.method, route }, requestSize);
        }
        
        const responseSize = parseInt(res.get('content-length')) || 0;
        if (responseSize > 0) {
            httpResponseSize.observe(labels, responseSize);
        }
    });

    next();
};

/**
 * Express handler for /metrics endpoint
 */
const metricsHandler = async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (err) {
        res.status(500).end(err.message);
    }
};

/**
 * Helper function to time database operations
 */
const timeDbOperation = (operation, table) => {
    const endTimer = dbQueryDuration.startTimer({ operation, table });
    return (success = true) => {
        endTimer();
        dbQueriesTotal.inc({ operation, table, status: success ? 'success' : 'error' });
    };
};

/**
 * Update database connection pool metrics
 */
const updateDbPoolMetrics = (pool) => {
    if (pool && pool.pool) {
        const poolInfo = pool.pool;
        dbConnectionsActive.set(poolInfo._allConnections?.length || 0);
        dbConnectionPoolSize.set(poolInfo.config?.connectionLimit || 0);
    }
};

module.exports = {
    register,
    metricsMiddleware,
    metricsHandler,
    timeDbOperation,
    updateDbPoolMetrics,
    // Export individual metrics for direct use
    metrics: {
        httpRequestsTotal,
        httpRequestDuration,
        httpActiveConnections,
        httpRequestSize,
        httpResponseSize,
        dbQueryDuration,
        dbQueriesTotal,
        dbConnectionsActive,
        dbConnectionPoolSize,
        urlsShortenedTotal,
        redirectsTotal,
        shortIdCollisions,
        urlValidationErrors,
        errorsTotal
    }
};
