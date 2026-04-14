/**
 * Load testing script for aleromano.com using autocannon
 * by Matteo Collina (https://github.com/mcollina/autocannon)
 *
 * Usage:
 *   node scripts/load-test.mjs [smoke|load|stress]
 *
 *   smoke  — quick sanity check (5 connections, 15s)
 *   load   — sustained ramp-up similar to a real traffic spike (default)
 *   stress — push beyond normal capacity to find limits
 */

import autocannon from "autocannon";
import { promisify } from "util";

const run = promisify(autocannon);

const BASE_URL = "https://aleromano.com";

// Requests cycle through all these in round-robin per connection.
// The POST /api/contact uses an intentionally invalid payload so the server
// returns a fast 400 without triggering email delivery.
const REQUESTS = [
  { method: "GET", path: "/" },
  { method: "GET", path: "/about" },
  { method: "GET", path: "/blog" },
  { method: "GET", path: "/contact" },
  { method: "GET", path: "/posts/simple-vps-observability" },
  { method: "GET", path: "/posts/high-agency-ai-philosophy" },
  { method: "GET", path: "/posts/3-career-tips" },
  {
    method: "POST",
    path: "/api/contact",
    headers: { "content-type": "application/json" },
    // Missing required fields → instant 400, no email sent
    body: JSON.stringify({ reason: "load-test-probe" }),
  },
];

async function runStage({ connections, duration, label }) {
  console.log(
    `\n${"─".repeat(60)}\n Stage: ${label}\n Connections: ${connections} | Duration: ${duration}s\n${"─".repeat(60)}`
  );

  const result = await run({
    url: BASE_URL,
    connections,
    duration,
    requests: REQUESTS,
    title: label,
  });

  autocannon.printResult(result);
  return result;
}

function summarise(results) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(" Summary");
  console.log(`${"═".repeat(60)}`);

  const allPassed = results.every(
    (r) => r["2xx"] > 0 && r.errors === 0 && r.timeouts === 0
  );

  results.forEach((r) => {
    const rps = r.requests.average.toFixed(0);
    const p95 = r.latency.p97_5.toFixed(1);
    const errors = r.errors + r.timeouts;
    const status = errors === 0 ? "✓" : "✗";
    console.log(
      `  ${status} ${r.title.padEnd(30)} ${rps.padStart(6)} req/s   p97.5=${p95}ms   errors=${errors}`
    );
  });

  console.log("");
  if (allPassed) {
    console.log("  All stages passed — your VPS handled it. Nice.");
  } else {
    console.log(
      "  Some stages had errors or timeouts — check your server logs."
    );
  }
  console.log("");
}

const MODES = {
  smoke: [
    { connections: 5, duration: 15, label: "Smoke (5 VU × 15s)" },
  ],

  load: [
    { connections: 20, duration: 30, label: "Ramp-up  (20 VU × 30s)" },
    { connections: 50, duration: 60, label: "Sustained (50 VU × 60s)" },
    { connections: 100, duration: 30, label: "Peak     (100 VU × 30s)" },
    { connections: 100, duration: 60, label: "Hold     (100 VU × 60s)" },
    { connections: 20, duration: 30, label: "Cool-down (20 VU × 30s)" },
  ],

  stress: [
    { connections: 50,  duration: 30, label: "Warm-up   ( 50 VU × 30s)" },
    { connections: 100, duration: 30, label: "Normal   (100 VU × 30s)" },
    { connections: 200, duration: 30, label: "High     (200 VU × 30s)" },
    { connections: 300, duration: 30, label: "Breaking (300 VU × 30s)" },
    { connections: 50,  duration: 30, label: "Recovery  ( 50 VU × 30s)" },
  ],
};

async function main() {
  const mode = process.argv[2] ?? "load";

  if (!MODES[mode]) {
    console.error(`Unknown mode "${mode}". Use: smoke | load | stress`);
    process.exit(1);
  }

  console.log(`\nautocanon load test — mode: ${mode}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Endpoints under test:`);
  REQUESTS.forEach((r) => console.log(`  ${r.method} ${r.path}`));

  const stages = MODES[mode];
  const results = [];

  for (const stage of stages) {
    const result = await runStage(stage);
    results.push(result);
  }

  summarise(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
