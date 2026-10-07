---
name: site-design
description: 'Design, build and ship a website to a fixed baseline: security (OWASP Top 10, MITRE ATT&CK and D3FEND, scanning tools, dependency automation), minimal data collection, WCAG 2.2 AA accessibility with an AI disclosure, resource efficiency, and the lukahn.com visual language. Use when: starting a new site or web app; adding a page, endpoint, form, script or dependency to an existing site; setting up CI, Dependabot or deployment; deploying to Scaleway behind Cloudflare; or reviewing an existing site against these requirements.'
---

# Designing and shipping a site

Every site gets the same baseline: **secure**, **accessible**, **cheap to run**,
and **visually consistent with lukahn.com**. This skill covers all four, the
deployment shape (Scaleway origin, Cloudflare edge), and the scans that prove it.

A worked example of this whole pipeline is the `passkey-reflect` repo: its
`.github/workflows/ci.yml`, `Dockerfile`, `pyproject.toml` and
`docs/scaleway-serverless-containers.md` are the reference implementation.

## When to use

- Starting a new site or a single-purpose web app.
- Adding a page, endpoint, form, script, or dependency to an existing site.
- Setting up CI, Dependabot, or a deployment pipeline.
- Deploying to Scaleway, or changing Cloudflare settings for a site.
- Reviewing an existing site against these requirements.

## The four rules that decide everything else

1. **Collect no user data unless the feature is impossible without it.** No
   accounts, no analytics, no third-party requests, no cookies that are not
   strictly necessary. Where state must exist, prefer keeping it in the client
   (one sealed cookie) over a server-side store, and write down in the repo docs
   why it exists at all.
2. **Scan locally before deploying.** Everything under "Scanning" passes
   against a local container before anything is pushed to Scaleway.
3. **Disclose AI authorship on the page itself,** in visible text, near the top.
4. **Prefer the cheaper, smaller, more restricted option.** Fewer dependencies,
   less data, lower resource tier, narrower permissions, fewer public endpoints.

---

# 1. Security

## Engineering rules

- **Threat model first.** Before writing code, answer in the commit or PR: who
  can reach this, with what input, and what could they make it do?
- **No secrets in code, git, logs, or images.** Use Scaleway Secret Manager or
  secret environment variables. Logs never contain tokens, cookies, credentials,
  or personal data.
- **Validate and normalise at the boundary.** Enforce content types, cap body
  size, and reject anything unexpected. Fail closed: unknown input denies.
- **Parameterised data access only.** Never build a query or a shell command by
  string interpolation.
- **Least privilege everywhere.** Separate roles for app and workers, non-root
  containers, read-only root filesystem, dropped capabilities, no-new-privileges.
- **Security headers on every response.** CSP, HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`. A site that
  self-hosts everything can run `default-src 'none'` with explicit `'self'`
  allowances and no `'unsafe-inline'` — that alone removes whole classes of
  attack, and it is also the efficiency win.
- **Sessions.** `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Strict`, short
  TTL, rotated on page load where the design allows.
- **Guards on state-changing endpoints.** Correct content type (else 415) and an
  origin check (else 403). Both are one-liners and both break real attacks.
- **Rate limit.** Cheap, best-effort limiting in the app is fine, but remember a
  per-visitor budget can only be enforced at the edge (see Cloudflare).
- **Publish `security.txt`** (RFC 9116) at `/.well-known/security.txt` plus a
  `/security.txt` fallback, with `Canonical` and an `Expires` you re-bump
  annually.
- **Domain hygiene.** CAA record pinning which CAs may issue, DNSSEC, and
  SPF/DKIM/DMARC on the mail domain.

## Frameworks to check against

### OWASP Top 10 (2021) — the primary checklist

| Risk | Control for a site |
|---|---|
| A01 Broken Access Control | Deny by default; scope every query to the owner; no direct object references without an ownership check; one visitor can never reach another's data **or** infer that it exists |
| A02 Cryptographic Failures | TLS everywhere; HSTS; sealed state with AES-GCM or libsodium (never hand-rolled); no secrets in URLs or logs |
| A03 Injection | Parameterised queries; no shell interpolation; strict content types; escape on output; CSP as defence in depth |
| A04 Insecure Design | Threat model; rate and size limits; timeouts; minimal data by design; fail closed |
| A05 Security Misconfiguration | Strict CSP and headers; no debug in production; non-root container; no directory listing; error pages that leak nothing |
| A06 Vulnerable Components | Dependabot for every ecosystem; dependency audit in CI; image and OS-package scanning |
| A07 Identification and Authentication Failures | Passkeys/WebAuthn rather than shared secrets where possible; short TTLs; attempt limits; no credential-stuffing surface |
| A08 Software and Data Integrity Failures | Lockfiles committed; CI actions pinned by SHA; SRI if a third-party asset is ever unavoidable; immutable images |
| A09 Security Logging and Monitoring Failures | Log security-relevant events without PII; enable Scaleway Cockpit with retention; alert on error rate |
| A10 Server-Side Request Forgery | Do not take URLs from users. If unavoidable, allowlist schemes and hosts, resolve and reject private, loopback, link-local, reserved and metadata ranges, then connect to the validated IP |

### MITRE ATT&CK — threat-informed design

ATT&CK describes adversary behaviour, so for a site it is a way to check that
each realistic technique has a countermeasure. Only include the subset that
actually applies; a brochure site does not need cloud or ICS techniques.

| Technique | What it looks like for a site | Countermeasure |
|---|---|---|
| T1595 Active Scanning | Port and path enumeration against the origin | Harden: close unused ports, keep the origin hostname private, WAF |
| T1190 Exploit Public-Facing Application | Exploiting the app or its framework | Harden: patched dependencies, input validation, edge managed rules |
| T1110 Brute Force | Credential stuffing at a login | Harden: passkeys, edge rate limits; Detect: auth-failure alerting |
| T1499 Endpoint Denial of Service | Flooding the origin or an expensive endpoint | Harden/Isolate: edge rate limiting and bot rules, body caps, `max-scale 1` so a flood cannot scale your bill |
| T1552 Unsecured Credentials | Secrets in git, logs, or an image layer | Harden: Secret Manager, secret scanning, no plaintext credentials |
| T1539 / T1550.004 Session cookie theft or replay | Stealing a session cookie | Harden: `__Host-` + HttpOnly + Secure + SameSite=Strict, short TTL |
| T1195 Supply Chain Compromise | A malicious package or CI action | Harden: lockfiles, SHA-pinned actions, Dependabot, SBOM |
| T1505 Server Software Component | A web shell written into the app | Harden/Isolate: read-only root filesystem, non-root, no writable path outside tmpfs; Detect: image drift |
| T1071 Application Layer Protocol | C2 beaconing from a compromised host | Isolate: minimal egress, no unexpected outbound traffic from the app |

### MITRE D3FEND — the defensive counterpart

Map each applicable technique to a countermeasure in the D3FEND tactics:
**Model, Harden, Detect, Isolate, Deceive, Evict, Restore**. For a small site
only Model, Harden and Isolate are genuinely in scope; Detect is limited to edge
logs and Cockpit, and Evict/Restore to redeploying a known-good image.

D3FEND countermeasure identifiers change between framework versions — look the
current ID up at d3fend.mitre.org rather than copying one from memory.

### Also worth checking

- **OWASP ASVS** — use Level 1 (or 2 for anything with accounts) as the
  verification bar and record which level you are claiming.
- **OWASP Secure Headers Project** and the **OWASP Cheat Sheet Series** for the
  specific control you are implementing.
- **CWE Top 25** for a targeted read on the mistakes that actually recur.
- **CIS Docker Benchmark** for the container, and **Mozilla SSL Configuration**
  for TLS settings.
- **OpenSSF Scorecard** for repository posture (pinned dependencies, branch
  protection, token permissions).

## Scanning

Run every static check locally and in CI. Run the dynamic checks against a local
container first, and against the deployed origin only when you need to.

### Static

| Target | Tool |
|---|---|
| Secrets in history and working tree | gitleaks, plus GitHub secret scanning and push protection |
| Python | ruff with the `S` and `BLE` rules, bandit, pip-audit |
| Node | eslint security plugins, `npm audit --audit-level=high` |
| Rust | `cargo audit`, `cargo deny check` |
| Ruby | `bundler-audit` |
| Cross-language SAST | semgrep; CodeQL via GitHub code scanning |
| Dockerfile | hadolint |
| Workflow files | actionlint, zizmor |
| Image and OS packages | trivy (or docker scout) |
| SBOM | syft, or `docker buildx --sbom` |
| Repo posture | OpenSSF Scorecard |

### Dynamic (running app)

| Target | Tool |
|---|---|
| Baseline DAST | OWASP ZAP baseline: `docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:8000` |
| Templated checks | nuclei |
| TLS and headers | testssl.sh against the origin; Mozilla Observatory, SSL Labs and securityheaders.com against the public edge |
| Accessible path | axe (`@axe-core/cli`), pa11y, Lighthouse |

### Rules for scanning

- **Local first, always.** Build the image, run it, scan `localhost`. It is
  faster, repeatable, and never touches production.
- **Only scan what you own.** Keep rates low, and never point a scanner at a
  third party.
- **Cloudflare will block your scanner.** WAF and bot rules will challenge or
  403 it. Either allowlist your egress IP for the duration, add a scoped WAF
  skip rule, or scan the origin directly. Do not turn protection off and leave it
  off.
- **Pin scanner versions** (images by digest or tag) so results are reproducible.
- **Document what is not covered.** A clean report from a tool that never looked
  at your base image is not a clean bill of health. Say so in the README.
- **Never upload private code or data to a third-party scanning service.**

## Dependencies and the build pipeline

- **Dependabot** (or Renovate) for every ecosystem the repo actually has:
  language manifests (`pip`, `npm`, `cargo`, `bundler`, `gomod`), `github-actions`,
  and `docker`. Weekly is enough.
- **Known gap:** container images and tool versions referenced *inside* a
  workflow file are not a Dependabot ecosystem. Bump those by hand and say so in
  a comment near the pin.
- **CI runs on every push,** in this order: lint, test, static analysis,
  dependency audit, secret scan, then build the image and **boot it and curl a
  real endpoint**. A pipeline that never runs the artefact does not prove it
  starts.
- **Harden the workflow itself:** actions pinned to full commit SHAs with a
  version comment, `permissions: contents: read` (widen per job only), a
  `concurrency` group to cancel superseded runs, and `persist-credentials: false`
  on checkout. `fetch-depth: 0` only where history is needed, such as gitleaks.
- **Prefer tools that need no licence or account** for a private repo, so the
  pipeline does not break the first time it runs (this is why gitleaks runs as a
  CLI image rather than as its GitHub Action).
- **Fail the build on findings.** Warnings that never fail accumulate.

## Scaleway deployment

- **Shape:** Serverless Containers (or Functions) for anything without steady
  traffic. Start at the minimums — 70 mvCPU, 128 MB, 1 GB local storage, 30s
  timeout, `min-scale 0`, `max-scale 1` — and raise a limit only with evidence.
  `max-scale 1` also caps what a flood can cost you.
- **Secrets** go in Secret Manager or `secret-environment-variables.*`, never in
  the plaintext environment map.
- **Verify every change.** `scw container container get <id>` and check
  `image`, `updated_at` and the environment map. Two traps:
  - `container update` **replaces the entire plaintext environment map** if you
    pass any `environment-variables.*` flag. Pass every variable, every time.
  - A combined update can be accepted yet silently not apply. Re-run it
    image-only, then re-check `container get`.
- **Routing is by `Host`.** A hostname that is not registered as a container
  domain gets a 404 **from the edge**, not from your app. Register the domain
  even when Cloudflare terminates TLS.
- **Keep `https-connections-only=true`**, and only disable the public endpoint
  when a private network path exists.
- **Logs:** enable Cockpit per project and set a retention. `container logs` can
  return nothing while Cockpit is still ingesting — query the data source when
  you need history, and remember the API token needs the logs scope *and* to
  belong to the same project as the data source.
- **Cost:** check `scw billing consumption` periodically. The usual surprises are
  registry storage and a Load Balancer or Edge Services you did not mean to
  create.
- Reference: `passkey-reflect/docs/scaleway-serverless-containers.md`.

## Cloudflare

- **SSL/TLS mode must be Full (strict).** Flexible means Cloudflare talks
  plaintext to your origin; combined with `https-connections-only` that is an
  infinite redirect loop. The tell-tale is a 301 whose `Location` equals the URL
  you requested.
- **Zone default versus per-host rules.** Check the zone default, not just the
  hostname's rule — a rule that overrides SSL mode for one hostname **must match
  the whole host including a path wildcard**. An expression of just the hostname
  matches only `/`, so every other path silently falls back to the zone default.
  This has caused a live outage (the page loads, the CSS and JS redirect-loop).
- **Edge security:** WAF managed rules including the OWASP ruleset, bot
  protection, and **rate-limiting rules at the edge**. The edge is the only place
  a genuine per-visitor budget exists — an app behind a proxy sees the edge's
  address, not the visitor's, so it will either over- or under-count.
- **TLS settings:** Always Use HTTPS, HSTS with a long `max-age` plus
  `includeSubDomains` and `preload` once every subdomain is ready, minimum TLS
  1.2, TLS 1.3, Opportunistic Encryption.
- **Cache rules:** never cache HTML or API responses (`no-store`); static assets
  may be cached. When a change does not appear, check `cf-cache-status` before
  debugging anything else.
- **Set your security headers at the origin** so they survive a bypass.
  Cloudflare adds its own (`HSTS`, `expect-ct`, `referrer-policy`,
  `x-frame-options`) — convenient, but do not depend on them.
- **Protect the origin:** do not publish the hostname, restrict direct access,
  and consider Authenticated Origin Pulls.

## Resource efficiency

- **Self-host every asset** — JavaScript, CSS, fonts, icons. No third-party CDNs,
  no fonts loaded from someone else's origin, no tag managers. This is a privacy
  win, a performance win, and a supply-chain win at the same time.
- **Ship less JavaScript.** A brochure page or a single-purpose tool should be
  plain HTML plus a small local script. No framework, no analytics, no polyfill
  bundle.
- **Fonts:** subset them, use `font-display: swap`, and prefer a system stack
  unless the design needs otherwise (lukahn.com self-hosts Open Sans).
- **Containers:** multi-stage build, slim or alpine runtime, no build toolchain
  in the final image, a real `.dockerignore`, minimal layers. A smaller image is
  a smaller attack surface and a faster cold start.
- **Measure and treat regressions as bugs:** image size, page weight, request
  count, Lighthouse performance.
- Cold starts at `min-scale 0` are the price of the cheapest tier. Fine for a
  demonstration; reconsider for anything with an availability promise.

---

# 2. Accessibility (WCAG 2.2 AA)

Every site conforms to WCAG 2.2 Level AA — that is every Level A and Level AA
success criterion. Items tagged **site** belong to whoever builds the theme and
templates; **content** items belong to whoever writes the words. (The
`author-content` skill carries the content-side list for the Jekyll site; keep
the two in step.)

### Perceivable

- **1.1.1 Non-text Content (A)** — content: descriptive `alt` on meaningful images; `alt=""` on decorative ones; `aria-hidden="true"` on decorative icons.
- **1.2.1 Audio-only and Video-only (A)** — content: text alternative or transcript.
- **1.2.2 Captions (Prerecorded) (A)** — content: captions on video.
- **1.2.3 Audio Description or Media Alternative (A)** — content: audio description or a descriptive transcript.
- **1.2.4 Captions (Live) (AA)** — content: live video is captioned.
- **1.2.5 Audio Description (Prerecorded) (AA)** — content: audio description provided.
- **1.3.1 Info and Relationships (A)** — content: real headings, lists, tables; never fake structure with bold text.
- **1.3.2 Meaningful Sequence (A)** — content: order stays logical when linearised.
- **1.3.3 Sensory Characteristics (A)** — content: never refer to shape, position, or sound alone.
- **1.3.4 Orientation (AA)** — site: works in portrait and landscape.
- **1.3.5 Identify Input Purpose (AA)** — site: inputs expose their purpose (`autocomplete`).
- **1.4.1 Use of Color (A)** — site/content: colour is never the only cue; links are underlined or otherwise distinct.
- **1.4.2 Audio Control (A)** — content: nothing autoplays audio without controls.
- **1.4.3 Contrast (Minimum) (AA)** — site/content: 4.5:1 for body text, 3:1 for large text.
- **1.4.4 Resize Text (AA)** — site: usable at 200% zoom.
- **1.4.5 Images of Text (AA)** — content: real text, not pictures of text.
- **1.4.10 Reflow (AA)** — site: no horizontal scrolling at 320px or at 400% zoom.
- **1.4.11 Non-text Contrast (AA)** — site: UI components and meaningful graphics meet 3:1.
- **1.4.12 Text Spacing (AA)** — site: survives increased letter, word, and line spacing.
- **1.4.13 Content on Hover or Focus (AA)** — site: tooltip content is dismissible, hoverable, and persistent.

### Operable

- **2.1.1 Keyboard (A)** — site: everything works from the keyboard.
- **2.1.2 No Keyboard Trap (A)** — site: focus is never trapped.
- **2.1.4 Character Key Shortcuts (A)** — site: no single-key shortcuts, or they can be remapped.
- **2.2.1 Timing Adjustable (A)** — site: no time limits, or they can be extended.
- **2.2.2 Pause, Stop, Hide (A)** — site: moving or auto-updating content can be paused.
- **2.3.1 Three Flashes or Below Threshold (A)** — content: nothing flashes more than three times a second.
- **2.4.1 Bypass Blocks (A)** — site: a skip link.
- **2.4.2 Page Titled (A)** — site: a unique, descriptive `<title>`.
- **2.4.3 Focus Order (A)** — site: tab order follows the visual order.
- **2.4.4 Link Purpose in Context (A)** — content: link text means something alone; avoid "click here"; icon-only links need an accessible name.
- **2.4.5 Multiple Ways (AA)** — site: more than one route to the content.
- **2.4.6 Headings and Labels (AA)** — content: descriptive headings and labels.
- **2.4.7 Focus Visible (AA)** — site: a visible focus indicator, styled globally.
- **2.4.11 Focus Not Obscured (Minimum) (AA)** — site: sticky headers must not cover the focused element.
- **2.5.1 Pointer Gestures (A)** — site: no gesture-only interactions.
- **2.5.2 Pointer Cancellation (A)** — site: activation on release, not press.
- **2.5.3 Label in Name (A)** — site: the visible label is part of the accessible name.
- **2.5.4 Motion Actuation (A)** — site: no motion-only controls.
- **2.5.7 Dragging Movements (AA)** — site: dragging has a pointer or keyboard alternative.
- **2.5.8 Target Size Minimum (AA)** — site: targets at least 24×24 CSS px; 44×44 preferred.

### Understandable

- **3.1.1 Language of Page (A)** — site: `<html lang="...">`.
- **3.1.2 Language of Parts (AA)** — content: mark passages in another language.
- **3.2.1 On Focus (A)** — site: focus alone never changes context.
- **3.2.2 On Input (A)** — site: input alone never changes context unexpectedly.
- **3.2.3 Consistent Navigation (AA)** — site: navigation is in the same place across pages.
- **3.2.4 Consistent Identification (AA)** — site: the same thing is labelled the same way everywhere.
- **3.2.6 Consistent Help (A)** — site: help is in the same place on each page.
- **3.3.1 Error Identification (A)** — site/content: errors are described in text, not just colour.
- **3.3.2 Labels or Instructions (A)** — content: every input has a visible label and any needed instructions.
- **3.3.3 Error Suggestion (AA)** — site/content: errors say how to fix the problem.
- **3.3.4 Error Prevention (Legal, Financial, Data) (AA)** — site: confirm, review, or reverse destructive submissions.
- **3.3.7 Redundant Entry (A)** — site: do not ask for the same information twice.
- **3.3.8 Accessible Authentication (Minimum) (AA)** — site: no cognitive puzzle at login. Passkeys are the easy way to satisfy this.

### Robust

- **4.1.2 Name, Role, Value (A)** — site: custom controls expose correct semantics.
- **4.1.3 Status Messages (AA)** — site: dynamic status changes announced via `role="status"` or `aria-live`.

### Verifying it

1. Automated sweep with axe and Lighthouse on every page — then read the output,
   because these tools find roughly a third of real issues.
2. **Keyboard pass:** tab through the whole site. Every control reachable, focus
   always visible, no trap, sensible order.
3. **Contrast:** check every foreground/background pair actually used, including
   muted text and placeholder text.
4. **Reflow:** 320px wide, and 400% zoom.
5. **Screen reader:** one pass through the primary task with a real screen reader.
6. Record known gaps in the repo docs rather than leaving them implicit.

## AI disclosure

- Put it in **visible text on the page**, near the top — not in a footer, not in
  an HTML comment.
- Keep it short: 2–3 lines. Name the assistant, say it was built from a written
  specification, and say it has not been audited. Point the reader at the code.
- Do not claim human review that did not happen, and do not quietly drop the
  caveat to make the page look tidier.
- Keep the README's version consistent with the page. If the page says one thing
  and the repo says another, the page is wrong.
- On lukahn.com the `post` and `page` layouts render it automatically unless
  front matter sets `human_written: true`. A standalone app renders its own.

---

# 3. Presentation (lukahn.com palette)

Keep to the main site's colours. The palette comes from
`lukahn.github.io/css/style.scss`; the site is a **dark theme** — a charcoal base
with teal-blue and sage accents.

| Role | Name | Hex |
|---|---|---|
| Page background | `$dark` | `#2D2D29` |
| Deeper surface (cards, code) | `$darker` | `#21211E` |
| Raised surface | `$medium` | `#3B3B35` |
| Navbar / strong surface | `$dark-blue` | `#215A6D` |
| Accent, links, focus ring | `$light-blue` | `#9FDCDC` |
| Body text on dark | `$white` | `#FFFFFF` |
| Soft text / hover | `$light` | `#DFECE6` |
| Muted text | `$light-medium` | `#D0D0D0` |
| Positive | `$green` | `#92C7A3` |
| Attention | `$orange` | `#F07241` |
| Danger | `$red` | `#E06060` |

Deep purples (`$dark-purple #300030`, `$medium-purple #480048`,
`$regular-purple #601848`) exist for large blocks only.

Rules:

- **Reuse these hexes.** Introduce a new colour only when the palette genuinely
  cannot express something, and stay inside the same hue families (teal-blue,
  sage green, warm orange/red).
- **Mind which pairs are legal.** `$light-blue` and `$light` are *light* colours:
  they read well on `$dark` and `$darker`, and fail contrast on `$white`.
  `$dark-blue` is a surface, not body text on a dark background.
- **Carry the focus style over:** `:focus-visible { outline: 2px solid
  #9FDCDC; outline-offset: 2px; }`.
- **Typography:** Open Sans (self-hosted) for body text, and a monospace stack
  for code. Do not add a third family.
- **Rhythm:** keep the spacing scale, corner radius, and header/footer structure
  recognisably the same across sites, so lukahn.com and its siblings look related.

---

# Procedure

1. **Decide what data the site holds.** The target answer is "none". If it is not
   none, write down the justification and the retention period in the repo.
2. **Threat model** in a short paragraph, committed to the repo.
3. **Choose the cheapest correct shape** — static, then Scaleway container or
   function. No database unless the data requirement demands one.
4. **Build** with the palette, semantic HTML, and self-hosted assets.
5. **Local checks:** lint, tests, static scan, dependency audit, build the image,
   boot it, run the DAST baseline and the accessibility sweep against
   `localhost`.
6. **CI:** the same checks on every push, plus Dependabot and SHA-pinned actions.
7. **Deploy to Scaleway** at minimum resources, with secrets from Secret Manager,
   and the hostname registered as a container domain.
8. **Cloudflare:** Full (strict) TLS, WAF and bot rules, edge rate limiting,
   cache rules, HSTS, and origin protection.
9. **Verify the deployed site:** functional end-to-end test, the security
   headers, the 415/403 guards, the keyboard and screen-reader path, and a DAST
   run against the origin.
10. **Record** the deployed state, the versions, and every known gap in the repo
    docs.

# Checklist

Copy into the PR or the repo's deployment notes.

**Security**
- [ ] Threat model written down
- [ ] No secrets in code, logs, or the image
- [ ] CSP and the other security headers on every response
- [ ] Sessions: `__Host-`, Secure, HttpOnly, SameSite, short TTL
- [ ] 415 and 403 guards on state-changing endpoints
- [ ] Rate limiting in the app *and* at the Cloudflare edge
- [ ] `security.txt` published
- [ ] CAA, DNSSEC, SPF/DKIM/DMARC in DNS
- [ ] Static scans clean: secrets, language linters, Dockerfile, workflows
- [ ] Dependency audit clean; image and OS packages scanned
- [ ] DAST baseline clean against the local container
- [ ] Dependabot configured for every ecosystem, including `github-actions`
- [ ] CI actions pinned by SHA with least-privilege `permissions`
- [ ] Deployment at minimum resources; secrets from Secret Manager
- [ ] Container runs non-root, read-only filesystem where possible
- [ ] All assets self-hosted; no third-party runtime requests

**Accessibility**
- [ ] WCAG 2.2 AA sweep run (axe and Lighthouse) and read
- [ ] Keyboard pass complete; focus always visible
- [ ] Contrast checked on every real colour pair, including muted text
- [ ] Reflow checked at 320px and 400% zoom
- [ ] One screen-reader pass through the primary task
- [ ] AI disclosure visible near the top, and consistent with the README

**Presentation**
- [ ] Colours drawn from the lukahn.com palette
- [ ] Focus style carried over
- [ ] Typography limited to Open Sans plus a monospace stack

# If unsure

Prefer the more restrictive, smaller, and cheaper option: fewer public
endpoints, narrower permissions, less data retained, shorter token lifetimes,
fewer dependencies. When two designs are equally valid, pick the one with less
attack surface and less to maintain. Never ship a security or accessibility
decision as a TODO.

---

*This skill is kept in two places: `~/.copilot/skills/site-design/SKILL.md` for
cross-project use, and `.github/skills/site-design/SKILL.md` in
`lukahn.github.io` for version control. Keep the two in step.*
