/**
 * OpenTelemetry Tracing Module
 * Implements distributed tracing with Jaeger exporter
 * Enabled only when ENABLE_TRACING=true
 */

const isTracingEnabled = process.env.ENABLE_TRACING === 'true';

let sdk = null;
let api = null;

/**
 * Initialize OpenTelemetry tracing
 * Must be called before any other imports in the application
 */
const initTracing = async () => {
    if (!isTracingEnabled) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Tracing is disabled. Set ENABLE_TRACING=true to enable.',
            service: 'urlshortener-server'
        }));
        return null;
    }

    try {
        const opentelemetry = require('@opentelemetry/sdk-node');
        const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
        const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
        const { resourceFromAttributes } = require('@opentelemetry/resources');
        const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');
        
        api = require('@opentelemetry/api');

        // Configuration from environment
        const serviceName = process.env.OTEL_SERVICE_NAME || 'urlshortener-server';
        const serviceVersion = process.env.npm_package_version || '1.0.0';
        const jaegerEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
        
        // Sampling rate (default 10% in production, 100% otherwise)
        const samplingRate = parseFloat(process.env.OTEL_SAMPLING_RATE) || 
            (process.env.NODE_ENV === 'production' ? 0.1 : 1.0);

        // Configure OTLP exporter for Jaeger
        const traceExporter = new OTLPTraceExporter({
            url: jaegerEndpoint
        });

        // Create SDK with auto-instrumentation
        sdk = new opentelemetry.NodeSDK({
            resource: resourceFromAttributes({
                [ATTR_SERVICE_NAME]: serviceName,
                [ATTR_SERVICE_VERSION]: serviceVersion,
                'deployment.environment': process.env.NODE_ENV || 'development'
            }),
            traceExporter,
            instrumentations: [
                getNodeAutoInstrumentations({
                    // Instrument HTTP, Express, and MySQL
                    '@opentelemetry/instrumentation-http': {
                        enabled: true,
                        ignoreIncomingPaths: ['/health', '/metrics'] // Skip health and metrics endpoints
                    },
                    '@opentelemetry/instrumentation-express': {
                        enabled: true
                    },
                    '@opentelemetry/instrumentation-mysql2': {
                        enabled: true
                    },
                    // Disable instrumentation for packages we don't use
                    '@opentelemetry/instrumentation-fs': {
                        enabled: false
                    }
                })
            ],
            // Configure sampling
            sampler: samplingRate < 1 
                ? new (require('@opentelemetry/sdk-trace-base').TraceIdRatioBasedSampler)(samplingRate)
                : undefined
        });

        // Start the SDK
        sdk.start();

        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'OpenTelemetry tracing initialized',
            service: 'urlshortener-server',
            jaegerEndpoint,
            samplingRate
        }));

        // Graceful shutdown handler
        const shutdown = async () => {
            try {
                await sdk.shutdown();
                console.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: 'OpenTelemetry tracing terminated',
                    service: 'urlshortener-server'
                }));
            } catch (error) {
                console.error(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'ERROR',
                    message: 'Error terminating tracing',
                    service: 'urlshortener-server',
                    error: error.message
                }));
            }
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        return sdk;
    } catch (error) {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: 'Failed to initialize OpenTelemetry tracing',
            service: 'urlshortener-server',
            error: error.message,
            stack: error.stack
        }));
        return null;
    }
};

/**
 * Get the current active span
 */
const getActiveSpan = () => {
    if (!isTracingEnabled || !api) return null;
    return api.trace.getActiveSpan();
};

/**
 * Get trace context (traceId, spanId) from current span
 * Useful for correlating logs with traces
 */
const getTraceContext = () => {
    const span = getActiveSpan();
    if (!span) return {};
    
    const context = span.spanContext();
    return {
        traceId: context.traceId,
        spanId: context.spanId
    };
};

/**
 * Create a custom span for a specific operation
 */
const createSpan = (name, fn, attributes = {}) => {
    if (!isTracingEnabled || !api) {
        return fn();
    }

    const tracer = api.trace.getTracer('urlshortener-server');
    return tracer.startActiveSpan(name, { attributes }, async (span) => {
        try {
            const result = await fn();
            span.setStatus({ code: api.SpanStatusCode.OK });
            return result;
        } catch (error) {
            span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
            span.recordException(error);
            throw error;
        } finally {
            span.end();
        }
    });
};

/**
 * Add attributes to the current span
 */
const addSpanAttributes = (attributes) => {
    const span = getActiveSpan();
    if (span) {
        span.setAttributes(attributes);
    }
};

/**
 * Record an event on the current span
 */
const addSpanEvent = (name, attributes = {}) => {
    const span = getActiveSpan();
    if (span) {
        span.addEvent(name, attributes);
    }
};

module.exports = {
    initTracing,
    isTracingEnabled,
    getActiveSpan,
    getTraceContext,
    createSpan,
    addSpanAttributes,
    addSpanEvent
};
