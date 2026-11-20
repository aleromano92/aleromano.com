# Load tests never send mail, and only fail on transport errors

`scripts/load-test.mjs` (autocannon) cycles through the main pages and `POST /api/contact`.

## Decisions

- **The contact probe sends an intentionally invalid payload**, so the server answers with a
  fast 400 and never triggers email delivery.
- **Pass/fail is based on transport errors and timeouts only.** 4xx responses (including the
  probe's 400) and 3xx redirects are expected.
- The live req/s counter is shown without a progress bar, which would clobber the results
  table.
