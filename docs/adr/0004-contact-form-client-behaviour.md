# Contact form client: honest, testable, and never loses what the user typed

ADR-0001 defends `POST /api/contact`. These decisions shape the honest client in
`BaseContact.astro` and `contact-form.ts`, and the API details it depends on. They follow the
same principle: **never lose a Lead**.

## Decisions

- **Logic lives in `contact-form.ts`, free of DOM access**, so it is unit tested;
  `BaseContact.astro` only binds it to elements.
- **The Contact Reason drives the form.** Fields stay dimmed and disabled until a reason that
  needs a message is picked. `problems` routes to a GitHub issue instead, because that message
  would be Noise in the inbox. Switching reason only toggles what is enabled or visible. It
  never touches what the user typed.
- **A hidden blog post title must not leak.** A deep link (`?reason=blogpost&title=…`)
  preserves the title, but it is only submitted with the `blogpost` reason: the API puts it in
  the email subject. `URLSearchParams` already decodes values, so they are not decoded again.
  A second decode would throw on titles containing a literal `%`.
- **The Form Token is fetched on first interaction**, so it is already past its minimum age by
  the time a human finishes typing. Its endpoint sends `Cache-Control: no-store`, because a
  cached token would eventually be served past its maximum age.
- **The Honeypot is moved off-screen**, not hidden with `display: none`, which naive bots
  detect.
- **The API answers Human Mistakes with machine-readable codes, and the client owns the
  localized wording.** Unknown codes fall back to the server's message.
- **Email syntax is pragmatic**: `local@domain.tld`, deliberately stricter than RFC 5322 (no
  quoted locals, no IP domains). Those never come from humans typing their own address, while
  `name@gmailcom` does.
- **User text is escaped before URLs are linkified**, so markup in it can never be injected.
- **The select arrow is drawn with CSS, not a background-image SVG**, so it can follow the
  theme's colour variables.
