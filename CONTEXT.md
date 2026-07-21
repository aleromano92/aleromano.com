# aleromano.com

Personal website and blog of Alessandro Romano: bilingual (EN/IT) content, a contact
form that exists to win consultancy/mentoring leads, and self-hosted infrastructure
with a strict no-third-party-services stance.

## Language

### Contact

**Lead**:
A genuine human submission through the contact form — the asset the form exists to capture.
_Avoid_: message, inquiry, request

**Noise**:
A non-human or junk submission that reaches the inbox. Deletable in one keystroke; never worth losing a Lead to prevent.
_Avoid_: spam (too broad — email spam is a different problem)

**Contact Reason**:
The sender's declared purpose, chosen from a fixed list (consultancy, mentoring, job, blogpost, general, problems). Drives form behaviour and email subject.
_Avoid_: category, topic

**Form Token**:
A time-stamped, site-issued proof that the sender obtained it from this site and waited a human-plausible interval before submitting. Replayable within its validity window; expires on deploy.
_Avoid_: CSRF token, captcha, nonce (implies single-use)

**Honeypot**:
A decoy field that honest clients always send empty. Part of the API contract: missing or filled means the sender is not the honest client.
_Avoid_: trap field, hidden field

**Tripwire Rejection**:
Refusing a submission that failed a bot check, with a deliberately generic error that teaches the sender nothing.
_Avoid_: validation error (that's for Human Mistakes)

**Human Mistake**:
A submission flaw a genuine person can fix (e.g. a typo'd email address). Gets precise, bilingual, actionable feedback — the opposite register from a Tripwire Rejection.
