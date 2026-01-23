
# Goal
Add metrics endpoints and improve logging for observability in the URL Shortener Web Application.

# Requirements
1. Metrics Endpoints
- Implement Prometheus metrics endpoints in the backend server.
- Ensure metrics include request counts, response times, error rates, and database query performance...
- Document the metrics endpoints and how to access them.

2. Logging Improvements
- Enhance logging in the backend server to include more detailed information about requests and errors.
- Ensure logs are structured and can be easily parsed by log management systems.
- Update logging configuration to allow different log levels (info, debug, error).
- Document the logging format and configuration options.

- Enhance logging in the frontend application to capture user interactions and errors.
- Ensure frontend logs are structured and can be sent to a centralized logging system.
- Document the frontend logging format and configuration options.

- the logging should be meaning full, time stamped, and should include request ids where applicable but not too verbose.

3. Tracing Integration
- Integrate distributed tracing using OpenTelemetry in both backend and frontend applications.
- Ensure traces capture end-to-end request flows, including database interactions and external API calls.
- Document how to access and interpret tracing data.
- The tracing system should be only enabled when the env flag is set. By default, it should be disabled.

4. Testing
- Use playwright mcp to verify that the metrics endpoints are accessible and return correct data.
- Test logging outputs to ensure they contain the expected information.
- Validate that tracing captures the necessary information for end-to-end request flows.

# Context
- Use context7 and fetch tools to get latest versions of Prometheus client libraries and OpenTelemetry SDKs for both backend and frontend.
- You should create new branches for this feature from develop branch.

# Clarifications
Metrics Endpoint
- path: /metrics for Prometheus scraping.
- Should the metrics endpoint be publicly accessible or protected with authentication? public for now
- Do you want metrics for both the server and client applications, or just the server? only server for now

Logging Improvements
- What log management system are you using or planning to use? (ELK, Loki, CloudWatch, Datadog, etc.) - This affects the structured logging format choice (JSON, logfmt, etc.). Plan to use Loki and FlutentBit to ship logs.
- For request IDs: 
Should the application generate them internally, or do you expect them from an upstream load balancer/proxy (e.g., X-Request-ID header)?
Should request IDs be returned in response headers?
=> Not sure about those questions, you can decide.

- For frontend logging
Should logs be sent to a centralized logging system, or just output to the browser console? - send to centralized logging system with FluentD agent running in the kubernetes node. So the logs just need to be in structured format and printed to console.

Tracing Integration
- Where should OpenTelemetry traces be exported to? jaeger
- What environment variable name should control tracing? ENABLE_TRACING
- Should we configure sampling rates, or trace 100% of requests when enabled? I dont have experience with tracing, so you can decide.

Deployment & Configuration
- Should the Helm chart and Docker Compose configurations be updated to include:
Prometheus scraping annotations/labels? Yes
Tracing backend services (Jaeger/Tempo)? Yes
Logging configuration environment variables? Yes

- Do you want a separate document for metrics/logging/tracing documentation, or should it be added to the existing README? 
Separate document is preferred.

Scope:
- The current project has MariaDB deployment - should database-level metrics (MariaDB exporter) be included in this scope, or only application-level metrics? database-level metrics should be included.