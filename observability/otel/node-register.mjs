import { register } from 'node:module';
import os from 'node:os';
import process from 'node:process';
import { createAddHookMessageChannel } from 'import-in-the-middle';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import semanticConventions from '@opentelemetry/semantic-conventions';

const serviceNameAttribute =
    semanticConventions.ATTR_SERVICE_NAME || semanticConventions.SEMRESATTRS_SERVICE_NAME || 'service.name';

const deploymentEnvironmentAttribute =
    semanticConventions.ATTR_DEPLOYMENT_ENVIRONMENT
    || semanticConventions.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
    || 'deployment.environment';

const endpointBase = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').replace(/\/$/, '');

if (!endpointBase) {
    console.warn('[otel] OTEL_EXPORTER_OTLP_ENDPOINT not set, tracing disabled.');
} else {
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    // The server is ESM, so instrumentations need an ESM loader hook: without it
    // `import 'node:http'` bypasses the require hook and no spans are created.
    // The message channel limits the hook to modules an instrumentation targets.
    const { registerOptions, waitForAllMessagesAcknowledged } = createAddHookMessageChannel();
    register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [serviceNameAttribute]: process.env.OTEL_SERVICE_NAME || 'aleromano-web',
            [deploymentEnvironmentAttribute]: process.env.NODE_ENV || 'production',
        }),
        traceExporter: new OTLPTraceExporter({
            url: `${endpointBase}/v1/traces`,
        }),
        instrumentations: [getNodeAutoInstrumentations()],
    });

    let sdkStarted = false;
    try {
        sdk.start();
        sdkStarted = true;
    } catch (error) {
        console.error('[otel] SDK start error, tracing disabled:', error);
    }
    await waitForAllMessagesAcknowledged();

    if (sdkStarted) {
        // A signal listener replaces Node's default exit, so flush spans and exit
        // ourselves. Re-raising the signal would not work: in the container node
        // is PID 1, and the kernel ignores signals PID 1 has no handler for.
        // The flush is capped so an unreachable collector can't outlast Docker's
        // 10s stop timeout, which would SIGKILL the server mid-request.
        const shutdown = async (signal) => {
            try {
                await Promise.race([
                    sdk.shutdown(),
                    new Promise((resolve) => setTimeout(resolve, 5000).unref()),
                ]);
            } catch (error) {
                console.error('[otel] shutdown error:', error);
            }
            process.exit(128 + os.constants.signals[signal]);
        };

        process.once('SIGTERM', shutdown);
        process.once('SIGINT', shutdown);
    }
}
