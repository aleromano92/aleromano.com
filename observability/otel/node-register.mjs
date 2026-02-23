import process from 'node:process';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

const endpointBase = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').replace(/\/$/, '');

if (!endpointBase) {
    console.warn('[otel] OTEL_EXPORTER_OTLP_ENDPOINT not set, tracing disabled.');
} else {
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'aleromano-web',
            [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'production',
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${endpointBase}/v1/traces`,
        }),
        instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();

    const shutdown = async () => {
        try {
            await sdk.shutdown();
        } catch (error) {
            console.error('[otel] shutdown error:', error);
        }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
