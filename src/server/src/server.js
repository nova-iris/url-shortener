// Initialize tracing before any other imports (required for auto-instrumentation)
const { initTracing } = require("./observability/tracing");

const express = require("express");
const cors = require("cors");
const { connect, close, getPool } = require("./configs/db");
const urlRouter = require("./controllers/url.controller");
const redirectRouter = require("./controllers/redirects.controller");
const { 
    metricsMiddleware, 
    metricsHandler, 
    updateDbPoolMetrics,
    metrics 
} = require("./observability/metrics");
const { 
    logger, 
    requestLoggingMiddleware, 
    attachRequestLogger 
} = require("./observability/logger");

const app = express();

// Observability middleware (order matters)
// 1. Request logging with request ID generation
app.use(requestLoggingMiddleware);
// 2. Attach child logger with request context
app.use(attachRequestLogger);
// 3. Metrics collection
app.use(metricsMiddleware);

app.use(cors());
app.use(express.json());

// Metrics endpoint for Prometheus scraping
app.get("/metrics", metricsHandler);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

// Add API prefix to URL routes
app.use("/api/url", urlRouter);
app.use("/", redirectRouter);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: "Not found",
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Log error with structured logging
    logger.error('Request error', {
        requestId: req.requestId,
        error: err.message,
        errorName: err.name,
        statusCode,
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });

    // Track error metrics
    metrics.errorsTotal.inc({ 
        type: err.name || 'UnknownError', 
        status_code: statusCode.toString() 
    });

    res.status(statusCode).json({
        error: err.name || "Internal Server Error",
        message: err.message || "An unexpected error occurred",
        requestId: req.requestId,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

const port = process.env.PORT || 5000;
let server;

// Start server after database connection and tracing initialization
const startServer = async () => {
    try {
        // Initialize tracing (if enabled)
        await initTracing();

        // Connect to database and initialize schema
        await connect();

        // Update database pool metrics periodically
        const pool = getPool();
        setInterval(() => updateDbPoolMetrics(pool), 15000);

        // Start listening
        server = app.listen(port, () => {
            logger.info('Server started', { port, nodeEnv: process.env.NODE_ENV });
        });
    } catch (err) {
        logger.error('Failed to start server', { error: err.message, stack: err.stack });
        process.exit(1);
    }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info('Shutdown signal received', { signal });

    if (server) {
        // Set a timeout for forceful shutdown
        const shutdownTimeout = setTimeout(() => {
            logger.warn('Forceful shutdown due to timeout');
            process.exit(1);
        }, 30000); // 30 seconds timeout

        server.close(async () => {
            clearTimeout(shutdownTimeout);
            logger.info('HTTP server closed');
            try {
                await close();
                logger.info('Database connection closed');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown', { error: err.message });
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();