import autocannon from "autocannon";

const BASE_URL = "https://aleromano.com";

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
    body: JSON.stringify({ reason: "load-test-probe" }),
  },
];

function runStage({ connections, duration, label }) {
  console.log(
    `\n${"─".repeat(60)}\n Stage: ${label}\n Connections: ${connections} | Duration: ${duration}s\n${"─".repeat(60)}\n`
  );

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      { url: BASE_URL, connections, duration, requests: REQUESTS, title: label },
      (err, result) => {
        if (err) return reject(err);
        autocannon.printResult(result);
        resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function summarise(results) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(" Summary");
  console.log(`${"═".repeat(60)}`);

  const allPassed = results.every(
    (r) => r.errors === 0 && r.timeouts === 0
  );

  results.forEach((r) => {
    const rps = r.requests.average.toFixed(0);
    const p97_5 = r.latency.p97_5.toFixed(1);
    const errors = r.errors + r.timeouts;
    const status = errors === 0 ? "✓" : "✗";
    console.log(
      `  ${status} ${r.title.padEnd(30)} ${rps.padStart(6)} req/s   p97.5=${p97_5}ms   errors=${errors}`
    );
  });

  console.log("");
  if (allPassed) {
    console.log("  All stages passed. Your VPS handled it. Nice.");
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

  console.log(`\nautocannon load test — mode: ${mode}`);
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
