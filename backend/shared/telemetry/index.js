'use strict';

const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

/**
 * Initialize OpenTelemetry for a MukkabootAI service
 * @param {string} serviceName - The name of the service
 * @param {Object} options - Additional configuration options
 */
function initializeTelemetry(serviceName, options = {}) {
  // Default configuration
  const config = {
    collectorUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    serviceNamespace: 'mukkaboot',
    ...options
  };

  // Create a custom resource
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: config.serviceNamespace,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    })
  );

  // Configure the SDK to export telemetry data
  const traceExporter = new OTLPTraceExporter({
    url: config.collectorUrl
  });

  // Register instrumentations
  const instrumentations = [
    getNodeAutoInstrumentations({
      // Instrument Express.js middleware
      '@opentelemetry/instrumentation-express': { enabled: true },
      // Instrument HTTP/HTTPS client requests
      '@opentelemetry/instrumentation-http': { enabled: true },
      // Instrument MongoDB client
      '@opentelemetry/instrumentation-mongodb': { enabled: true },
      // Add Redis instrumentation if used
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ];

  // Create and start SDK
  const sdk = new opentelemetry.NodeSDK({
    resource,
    traceExporter,
    instrumentations,
  });

  // Start the SDK
  sdk.start()
    .then(() => {
      console.log(`Tracing initialized for service: ${serviceName}`);
    })
    .catch((error) => {
      console.error('Error initializing tracing:', error);
    });

  // When service is shutting down
  const shutdown = () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => {
        if (process.exitCode !== undefined) {
          process.exit(process.exitCode);
        } else {
          process.exit(0);
        }
      });
  };

  // Handle graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return sdk;
}

module.exports = { initializeTelemetry };
