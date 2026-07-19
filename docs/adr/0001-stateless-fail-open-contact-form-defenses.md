# Stateless, fail-open anti-bot defenses for the contact form

After receiving low-effort bot spam, we added DIY (no third-party) defenses to
`POST /api/contact`. Guiding principle: **never lose a Lead to fight Noise** — the
form exists to win consultancy work; junk email costs one keystroke to delete.
Flood protection already exists in nginx (`limit_req`, 5r/m); the app layer only
has to make a *single* bot submission fail.

## Decisions

- **Enforcement lives in the API, not the form.** The observed bot may never have
  rendered our HTML; the form is just the honest client of a defended API.
- **Honeypot as API contract**: the decoy field must be *present and empty*.
  Absent (direct API scripts) and filled (form-filler bots) both fail.
- **Form Token, stateless and replayable**: HMAC-signed timestamp issued by a
  dedicated endpoint; the API enforces a minimum age (humans take seconds to type)
  and maximum age. No consumed-token storage — replay within the window is
  accepted because nginx caps the blast radius. Persistence for rate limiting
  belongs to nginx, not the app.
- **Ephemeral signing secret**, generated in-memory at process startup. No env var
  to provision and no unset-secret failure mode; deploys invalidate outstanding
  tokens, and the honest client heals by refetching and retrying once.
  **Assumption: single Node process.** Multiple instances would each hold a
  different secret — revisit this ADR before scaling out.
- **Email validation is for Human Mistakes, not bots**: server-side syntax check
  plus MX lookup via `node:dns`. **Fails open** — DNS trouble accepts the
  submission, because rejecting a possibly-real Lead is worse than admitting Noise.
- **Two error registers**: Tripwire Rejections return an honest-but-generic 400
  (no silent-success spamtrap: its failure mode is Leads vanishing invisibly);
  Human Mistakes get precise bilingual messages.

## Rejected alternatives

- **Visible CAPTCHA**: friction for humans, trivially solvable for bots.
- **Proof-of-work**: costs real phones battery, costs attackers pennies.
- **SMTP callout verification**: risks blacklisting the VPS IP that sends our own mail.
- **Email confirmation loop**: adds a click between a prospective client and us.
- **Silent-success on bot detection**: misconfiguration would silently discard Leads.
