/**
 * Observability Module Index
 * Exports all observability components: metrics, logging, and tracing
 */

const { 
    metricsMiddleware, 
    metricsHandler, 
    timeDbOperation, 
    updateDbPoolMetrics,
    metrics 
} = require('./metrics');

const { 
    logger, 
    createChildLogger,
    requestLoggingMiddleware, 
    attachRequestLogger,
    generateRequestId 
} = require('./logger');

const { 
    initTracing, 
    isTracingEnabled,
    getActiveSpan,
    getTraceContext,
    createSpan,
    addSpanAttributes,
    addSpanEvent
} = require('./tracing');

module.exports = {
    // Metrics exports
    metricsMiddleware,
    metricsHandler,
    timeDbOperation,
    updateDbPoolMetrics,
    metrics,
    
    // Logging exports
    logger,
    createChildLogger,
    requestLoggingMiddleware,
    attachRequestLogger,
    generateRequestId,
    
    // Tracing exports
    initTracing,
    isTracingEnabled,
    getActiveSpan,
    getTraceContext,
    createSpan,
    addSpanAttributes,
    addSpanEvent
};
