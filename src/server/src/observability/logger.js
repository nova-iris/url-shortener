/**
 * Structured Logging Module
 * Implements JSON-formatted logging for Loki/FluentBit collection
 */
const { randomUUID } = require('crypto');

// Log levels with numeric priorities
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Current log level from environment (default: info)
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;

/**
 * Format log message as structured JSON
 */
const formatLog = (level, message, meta = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        service: 'urlshortener-server',
        ...meta
    };

    // Add trace context if available
    if (meta.traceId) {
        logEntry.trace_id = meta.traceId;
        delete logEntry.traceId;
    }
    if (meta.spanId) {
        logEntry.span_id = meta.spanId;
        delete logEntry.spanId;
    }

    return JSON.stringify(logEntry);
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level) => {
    return LOG_LEVELS[level] <= currentLevel;
};

/**
 * Logger object with level-specific methods
 */
const logger = {
    error: (message, meta = {}) => {
        if (shouldLog('error')) {
            console.error(formatLog('error', message, meta));
        }
    },
    warn: (message, meta = {}) => {
        if (shouldLog('warn')) {
            console.warn(formatLog('warn', message, meta));
        }
    },
    info: (message, meta = {}) => {
        if (shouldLog('info')) {
            console.log(formatLog('info', message, meta));
        }
    },
    debug: (message, meta = {}) => {
        if (shouldLog('debug')) {
            console.log(formatLog('debug', message, meta));
        }
    }
};

/**
 * Generate a unique request ID
 * Accepts incoming X-Request-ID header or generates a new one
 */
const generateRequestId = (existingId) => {
    return existingId || randomUUID();
};

/**
 * Express middleware for request logging
 * Adds request ID and logs request/response details
 */
const requestLoggingMiddleware = (req, res, next) => {
    const start = Date.now();
    
    // Generate or use existing request ID
    req.requestId = generateRequestId(req.get('X-Request-ID'));
    
    // Set request ID in response header
    res.set('X-Request-ID', req.requestId);

    // Log request start (debug level to avoid verbosity)
    logger.debug('Request started', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection?.remoteAddress
    });

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 500 ? 'error' : 
                        res.statusCode >= 400 ? 'warn' : 'info';
        
        logger[logLevel]('Request completed', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            contentLength: res.get('Content-Length')
        });
    });

    next();
};

/**
 * Create a child logger with bound context
 * Useful for adding request-specific context to all logs
 */
const createChildLogger = (context = {}) => {
    return {
        error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
        warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
        info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
        debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta })
    };
};

/**
 * Express middleware to attach child logger with request context
 */
const attachRequestLogger = (req, res, next) => {
    req.log = createChildLogger({ requestId: req.requestId });
    next();
};

module.exports = {
    logger,
    createChildLogger,
    requestLoggingMiddleware,
    attachRequestLogger,
    generateRequestId,
    LOG_LEVELS
};
