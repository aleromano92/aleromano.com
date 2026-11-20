# Observability runtime: ESM-aware tracing, PID-1 shutdown, and a host monitor

The app is traced with OpenTelemetry. The VPS is watched by a small Node daemon
(`scripts/observability/monitor.js`) that alerts on Telegram.

## Decisions

- **Instrumentation registers an ESM loader hook.** The server is ESM, so without the hook
  `import 'node:http'` bypasses the require hook and no spans are created. A message channel
  limits the hook to the modules an instrumentation targets.
- **The app handles SIGTERM/SIGINT itself**: it flushes spans, then exits. Re-raising the
  signal would not work, because in the container node is PID 1 and the kernel ignores
  signals PID 1 has no handler for. The flush is capped, so an unreachable collector cannot
  outlast Docker's 10-second stop timeout and get the server SIGKILLed mid-request.
- **The monitor logs to its file only, not also to the console**, except in development.
  Its stdout is redirected to the same file, so writing both would duplicate every line.
- **The log scan treats grep's exit code 1 as "no matches"**, not as a failure.
