# Observability Guide

This document describes the observability features implemented in the URL Shortener application, including metrics, logging, and distributed tracing.

## Overview

The URL Shortener application includes comprehensive observability features:

- **Metrics**: Prometheus-compatible metrics endpoint for monitoring
- **Logging**: Structured JSON logging for log aggregation systems
- **Tracing**: OpenTelemetry-based distributed tracing with Jaeger

## Metrics

### Endpoint

The server exposes a Prometheus-compatible metrics endpoint at:

```
GET /metrics
```

### Available Metrics

#### HTTP Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `urlshortener_http_requests_total` | Counter | method, route, status_code | Total number of HTTP requests |
| `urlshortener_http_request_duration_seconds` | Histogram | method, route, status_code | HTTP request duration in seconds |
| `urlshortener_http_active_connections` | Gauge | - | Number of active HTTP connections |
| `urlshortener_http_request_size_bytes` | Histogram | method, route | HTTP request size in bytes |
| `urlshortener_http_response_size_bytes` | Histogram | method, route, status_code | HTTP response size in bytes |

#### Database Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `urlshortener_db_query_duration_seconds` | Histogram | operation, table | Database query duration in seconds |
| `urlshortener_db_queries_total` | Counter | operation, table, status | Total number of database queries |
| `urlshortener_db_connections_active` | Gauge | - | Number of active database connections |
| `urlshortener_db_connection_pool_size` | Gauge | - | Database connection pool size |

#### Business Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `urlshortener_urls_shortened_total` | Counter | type (custom/auto) | Total number of URLs shortened |
| `urlshortener_redirects_total` | Counter | status (success/not_found) | Total number of redirects served |
| `urlshortener_short_id_collisions_total` | Counter | - | Total short ID generation collisions |
| `urlshortener_url_validation_errors_total` | Counter | reason | Total URL validation errors |

#### Error Metrics

| Metric Name | Type | Labels | Description |
|------------|------|--------|-------------|
| `urlshortener_errors_total` | Counter | type, status_code | Total number of errors |

#### Node.js Default Metrics

Default Node.js metrics are also collected with the `urlshortener_` prefix, including:
- Process CPU usage
- Process memory usage
- Event loop lag
- Garbage collection statistics

### Prometheus Configuration

Add the following scrape configuration to your Prometheus:

```yaml
scrape_configs:
  - job_name: 'urlshortener'
    static_configs:
      - targets: ['server:5000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

For Kubernetes with Prometheus Operator, the server pods include annotations for automatic discovery:

```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "5000"
prometheus.io/path: "/metrics"
```

## Logging

### Backend Logging

The backend server uses structured JSON logging optimized for log aggregation systems like Loki with FluentBit.

#### Log Format

Each log entry is a JSON object with the following fields:

```json
{
  "timestamp": "2026-01-23T10:30:00.000Z",
  "level": "INFO",
  "message": "Request completed",
  "service": "urlshortener-server",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/url/shorten",
  "statusCode": 201,
  "durationMs": 45
}
```

#### Log Levels

Configure the log level using the `LOG_LEVEL` environment variable:

| Level | Description |
|-------|-------------|
| `error` | Only errors |
| `warn` | Errors and warnings |
| `info` | Standard operational logs (default) |
| `debug` | Verbose debugging information |

#### Request ID Tracking

- Each request is assigned a unique request ID
- If an `X-Request-ID` header is provided, it will be used
- The request ID is returned in the `X-Request-ID` response header
- All logs for a request include the `requestId` field for correlation

### Frontend Logging

The frontend application outputs structured JSON logs to the browser console, suitable for collection by FluentD/FluentBit agents.

#### Log Format

```json
{
  "timestamp": "2026-01-23T10:30:00.000Z",
  "level": "INFO",
  "message": "User action",
  "service": "urlshortener-client",
  "sessionId": "sess_abc123_xyz789",
  "url": "http://localhost:4173/",
  "action": "submit",
  "component": "InputForm"
}
```

#### Configuration

Set the log level using the `VITE_LOG_LEVEL` environment variable during build.

## Distributed Tracing

### Overview

The application supports OpenTelemetry-based distributed tracing with Jaeger as the backend. Tracing is disabled by default and can be enabled via environment variables.

### Enabling Tracing

Set the following environment variables:

```bash
ENABLE_TRACING=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
OTEL_SAMPLING_RATE=0.1  # 10% sampling (optional)
```

### Auto-Instrumentation

When enabled, the following are automatically traced:
- HTTP requests (incoming and outgoing)
- Express.js routes
- MySQL/MariaDB queries

### Viewing Traces

Access the Jaeger UI at `http://localhost:16686` (Docker Compose) or via the configured ingress in Kubernetes.

### Trace Context

Trace context (trace ID and span ID) is automatically propagated:
- Between services via HTTP headers
- Into structured logs for correlation

## Deployment Configuration

### Docker Compose

#### Basic Deployment

```bash
docker-compose up -d
```

#### With Tracing

```bash
docker-compose --profile tracing up -d
```

#### With Database Monitoring

```bash
docker-compose --profile monitoring up -d
```

#### With All Observability Features

```bash
docker-compose --profile tracing --profile monitoring up -d
```

#### Environment Variables

Add to your `.env` file:

```bash
# Logging
LOG_LEVEL=info

# Tracing (optional)
ENABLE_TRACING=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
OTEL_SAMPLING_RATE=0.1
```

### Helm Chart

#### Enable Metrics (default)

```yaml
observability:
  metrics:
    enabled: true
```

#### Enable Tracing with Jaeger

```yaml
observability:
  tracing:
    enabled: true
    samplingRate: "0.1"
    jaeger:
      deploy: true
```

#### Enable MariaDB Exporter

```yaml
observability:
  mariadbExporter:
    enabled: true
```

#### Full Observability Configuration

```yaml
server:
  env:
    LOG_LEVEL: "info"

observability:
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true  # For Prometheus Operator
  tracing:
    enabled: true
    samplingRate: "0.1"
    jaeger:
      deploy: true
  mariadbExporter:
    enabled: true
```

## Grafana Dashboards

### Recommended Dashboards

For comprehensive monitoring, consider importing these Grafana dashboards:

1. **Node.js Application Dashboard**: Use dashboard ID `11159` for Node.js metrics
2. **MySQL/MariaDB Dashboard**: Use dashboard ID `7362` for database metrics
3. **Custom URL Shortener Dashboard**: Create a custom dashboard with the business metrics

### Example Dashboard Panels

#### Request Rate

```promql
sum(rate(urlshortener_http_requests_total[5m])) by (route)
```

#### Request Latency (P95)

```promql
histogram_quantile(0.95, sum(rate(urlshortener_http_request_duration_seconds_bucket[5m])) by (le, route))
```

#### Error Rate

```promql
sum(rate(urlshortener_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(urlshortener_http_requests_total[5m]))
```

#### URLs Shortened Per Minute

```promql
sum(rate(urlshortener_urls_shortened_total[1m])) by (type)
```

#### Database Query Latency

```promql
histogram_quantile(0.95, sum(rate(urlshortener_db_query_duration_seconds_bucket[5m])) by (le, operation))
```

## Alerting Rules

### Example Prometheus Alerting Rules

```yaml
groups:
  - name: urlshortener
    rules:
      - alert: HighErrorRate
        expr: sum(rate(urlshortener_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(urlshortener_http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: Error rate is above 5% for the last 5 minutes

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(urlshortener_http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High latency detected
          description: 95th percentile latency is above 1 second

      - alert: DatabaseConnectionPoolExhausted
        expr: urlshortener_db_connections_active / urlshortener_db_connection_pool_size > 0.9
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: Database connection pool nearly exhausted
          description: More than 90% of database connections are in use
```

## Troubleshooting

### Metrics Not Available

1. Verify the server is running: `curl http://localhost:5000/health`
2. Check the metrics endpoint: `curl http://localhost:5000/metrics`
3. Ensure `prom-client` is installed: `npm ls prom-client`

### Tracing Not Working

1. Verify `ENABLE_TRACING=true` is set
2. Check Jaeger is running: `curl http://localhost:16686`
3. Verify OTLP endpoint is reachable
4. Check server logs for tracing initialization messages

### Logs Not in JSON Format

1. Ensure the observability module is loaded correctly
2. Check for any console.log statements that bypass the logger
3. Verify `LOG_LEVEL` environment variable is set correctly
