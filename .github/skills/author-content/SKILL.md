---
name: author-content
description: 'Author and edit blog posts and static pages for this Jekyll site (lukahn.com). Use when creating a new blog post or page, writing or updating content, or applying the site conventions such as front matter, categories, tags, reference-style links, the AI disclosure box, and the Jekyll build.'
---

# Authoring content for lukahn.com

## When to use
- Writing a new blog post or static content page
- Editing or restructuring existing posts and pages
- Checking that new content follows the site's conventions

## Site overview
- Jekyll site with `permalink: pretty`, so a post's URL is `/category/year/month/day/slug/`.
- Blog posts live in `_posts/` and are named `YYYY-MM-DD-slug.md`.
- Static content pages live at the repo root with `layout: page` and an explicit `permalink`.
- Build with `bundle exec jekyll build` after any change and confirm it succeeds.
- `_site/` is generated build output and is gitignored — never edit it by hand.

## Front matter
Use the template in [post-template.md](./assets/post-template.md) as a starting point.

Key fields:
- `layout` — `post` for blog posts, `page` for static pages.
- `title` — plain text, title case.
- `date` — `YYYY-MM-DD 00:00:00`.
- `author` — `Luke Wakefield`.
- `summary` — one sentence ending with a period.
- `categories` — a single lowercase word (see below).
- `thumbnail` — a Font Awesome solid icon name (see below).
- `tags` — lowercase, kebab-case, as a YAML list.
- `human_written` — only add `true` when the user wrote the content themselves (see AI disclosure).

## Categories and tags
- Existing categories: `website`, `openssl`, `jekyll`, `google`, `security`, `android`, `firefox`, `synology`. Reuse one if it fits, otherwise introduce a single lowercase category.
- Tags are lowercase and hyphenated (`password-manager`, `ffmpeg`, `nas`).

## Thumbnails
- `thumbnail` is a Font Awesome solid icon name rendered as `fa-<name>` (e.g. `heart`, `book`, `box-archive`, `images`, `magnifying-glass`).
- Only `gravatar` maps to an image via `_data/thumbnail.yml`; everything else uses an icon.

## Content style
- First-person, practical technical writing.
- Use Australian English (en-AU) spelling and grammar.
- Expand acronyms on first use, e.g. "Multi-factor Authentication (MFA)", and add any new terms to the Glossary page.
- Reference-style links: `[text][ref]` in the body, with `[ref]: url` definitions at the bottom of the file.
- Add `<br>` before top-level `##` sections.
- Do not hard-wrap prose lines — keep each paragraph on a single line.
- Start headings at `##` (the page title is the `h1`).
- Cite external sources in a `## References` section at the end.
- Store images locally under `images/<post-slug>/` (a folder named after the post) and give them descriptive alt text.

## AI disclosure
- Posts and pages automatically show an "AI disclosure" box (written by AI, guided by me) unless their front matter sets `human_written: true`.
- Never add the disclosure box manually — the `post` and `page` layouts render it automatically.

## Accessibility (WCAG 2.2 AA)
All content must conform to WCAG 2.2 Level AA, which means every Level A and
Level AA success criterion below. Items tagged **theme** are handled by the
site's templates and styles; items tagged **author** are the content author's
responsibility.

### Perceivable
- **1.1.1 Non-text Content (A)** — author: give every meaningful image descriptive `alt` text; decorative images use `alt=""` and decorative Font Awesome icons use `aria-hidden="true"`.
- **1.2.1 Audio-only & Video-only (A)** — author: provide a text alternative or transcript.
- **1.2.2 Captions (Prerecorded) (A)** — author: videos include captions.
- **1.2.3 Audio Description or Media Alternative (A)** — author: provide audio description or a descriptive transcript.
- **1.2.4 Captions (Live) (AA)** — author: live video includes captions.
- **1.2.5 Audio Description (Prerecorded) (AA)** — author: provide audio description for prerecorded video.
- **1.3.1 Info and Relationships (A)** — author: use real headings, lists, tables, and blockquotes instead of faking them with bold text.
- **1.3.2 Meaningful Sequence (A)** — author: keep content order logical when linearised.
- **1.3.3 Sensory Characteristics (A)** — author: never refer to things by shape, position, or sound alone.
- **1.3.4 Orientation (AA)** — theme: content works in portrait and landscape.
- **1.3.5 Identify Input Purpose (AA)** — theme: inputs expose their purpose.
- **1.4.1 Use of Color (A)** — theme/author: color is never the only cue; links are underlined site-wide.
- **1.4.2 Audio Control (A)** — author: no auto-playing audio, or provide controls.
- **1.4.3 Contrast (Minimum) (AA)** — theme/author: 4.5:1 for text, 3:1 for large text.
- **1.4.4 Resize Text (AA)** — theme: content remains usable at 200% zoom.
- **1.4.5 Images of Text (AA)** — author: use real text, not images of text.
- **1.4.10 Reflow (AA)** — theme: no horizontal scrolling at 320px width.
- **1.4.11 Non-text Contrast (AA)** — theme: UI components and graphics meet 3:1.
- **1.4.12 Text Spacing (AA)** — theme: content survives increased letter, word, and line spacing.
- **1.4.13 Content on Hover or Focus (AA)** — theme: hover/focus content is dismissible, hoverable, and persistent.

### Operable
- **2.1.1 Keyboard (A)** — theme: all functionality works with a keyboard.
- **2.1.2 No Keyboard Trap (A)** — theme: focus is never trapped.
- **2.1.4 Character Key Shortcuts (A)** — theme: no single-key shortcuts.
- **2.2.1 Timing Adjustable (A)** — author/theme: no time limits, or they can be adjusted.
- **2.2.2 Pause, Stop, Hide (A)** — author/theme: moving or auto-updating content can be paused.
- **2.3.1 Three Flashes or Below Threshold (A)** — author: no flashing content.
- **2.4.1 Bypass Blocks (A)** — theme: a skip link is provided.
- **2.4.2 Page Titled (A)** — theme: a unique, descriptive `<title>` comes from the front matter `title`.
- **2.4.3 Focus Order (A)** — theme: logical tab order.
- **2.4.4 Link Purpose (In Context) (A)** — author: link text is meaningful on its own; avoid "click here"; icon-only links need an accessible name (`aria-label`).
- **2.4.5 Multiple Ways (AA)** — theme: search, categories, and navigation provide multiple ways to find content.
- **2.4.6 Headings and Labels (AA)** — author: use descriptive headings and labels.
- **2.4.7 Focus Visible (AA)** — theme: a visible focus indicator is styled globally.
- **2.4.11 Focus Not Obscured (Minimum) (AA)** — theme: focused elements stay visible.
- **2.5.1 Pointer Gestures (A)** — theme: no gesture-only interactions.
- **2.5.2 Pointer Cancellation (A)** — theme: actions trigger on release, not press.
- **2.5.3 Label in Name (A)** — theme: the visible label matches the accessible name.
- **2.5.4 Motion Actuation (A)** — theme: no motion-only controls.
- **2.5.7 Dragging Movements (AA)** — theme: dragging has a pointer/keyboard alternative.
- **2.5.8 Target Size (Minimum) (AA)** — theme: targets are at least 24×24 px.

### Understandable
- **3.1.1 Language of Page (A)** — theme: `<html lang="en">`.
- **3.1.2 Language of Parts (AA)** — author: mark non-English passages with `lang="xx"`.
- **3.2.1 On Focus (A)** — theme: focus doesn't cause context changes.
- **3.2.2 On Input (A)** — theme: input doesn't cause unexpected context changes.
- **3.2.3 Consistent Navigation (AA)** — theme: navigation stays consistent across pages.
- **3.2.4 Consistent Identification (AA)** — theme: the same labels and icons identify the same things.
- **3.2.6 Consistent Help (A)** — theme: help is in the same place on each page.
- **3.3.1 Error Identification (A)** — author/theme: errors are described in text.
- **3.3.2 Labels or Instructions (A)** — author: inputs have clear labels and instructions.
- **3.3.3 Error Suggestion (AA)** — author/theme: errors suggest how to fix them.
- **3.3.4 Error Prevention (Legal, Financial, Data) (AA)** — theme: destructive actions can be reversed or confirmed.
- **3.3.7 Redundant Entry (A)** — theme: don't ask for the same information twice.
- **3.3.8 Accessible Authentication (Minimum) (AA)** — theme: no cognitive puzzle in login.

### Robust
- **4.1.2 Name, Role, Value (A)** — theme: custom controls expose correct semantics.
- **4.1.3 Status Messages (AA)** — theme: dynamic status changes are announced.

## Security best practices

### Content authoring
- Respect the site's Content Security Policy (`default-src 'self'`). Do not add inline `<script>`, event-handler attributes (`onclick`, etc.), third-party scripts, iframes/embeds, or externally-hosted images, styles, or fonts — the policy blocks them.
- Self-host all assets (scripts, styles, fonts, images); never add a runtime dependency on a third-party CDN.
- Never include secrets in content: passwords, API keys, tokens, private keys, or personal data.
- Redact credentials in examples and use placeholders such as `CHANGEME` (see the Tuta Mail post).
- Prefer HTTPS links; use `http://` only when the target genuinely has no HTTPS support.
- For any external link that opens in a new tab, use `target="_blank" rel="noopener noreferrer"`.
- Use plain Markdown syntax where possible and avoid raw HTML unless necessary.
- Mark fenced code blocks with a language for correct syntax highlighting, and make sure snippets are safe to run.

### Site maintenance
- Check for CVEs and keep dependencies current — see "Updating software packages" below.
- Pin GitHub Actions to commit SHAs (with a version comment), use least-privilege permissions, and bump actions when GitHub deprecates their Node runtime.
- Maintain `security.txt` (RFC 9116) at both `/.well-known/security.txt` (canonical) and `/security.txt` (fallback), with `Contact: mailto:security@lukahn.com`, `Preferred-Languages: en`, and `Canonical` pointing at the `/.well-known/` URL. Bump the `Expires` field annually.
- Keep the Cloudflare security headers set: `Strict-Transport-Security` (includeSubDomains, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: same-origin` (the HTTP header wins over any meta tag).
- Re-check the site against the OWASP Top 10 after significant changes; for A08 (Software and Data Integrity Failures), add Subresource Integrity hashes if any asset is ever served from a third party.

### Updating software packages
Updates are not fully automatic — the GitHub Actions build installs dependencies, but version bumps still need a human.
- **Ruby gems** — no `Gemfile.lock` is committed, so the Pages build (`bundle install` in CI) resolves the latest versions allowed by the Gemfile's `~>` constraints on every deploy. Patch and minor updates flow automatically; major-version bumps require editing the Gemfile by hand.
- **Node build tools** (`purgecss`, `glob`) — locked by `package-lock.json` and installed with `npm ci`, so they don't auto-update. Update with `npm update` (or bump `package.json`), then commit the lockfile.
- **Vendored front-end assets** (Font Awesome, highlight.js, Simple Jekyll Search, MathJax, Bootstrap, Google Fonts) — pinned with SHA-256 hashes in `scripts/update_dependencies.py`. The weekly `update-dependencies.yml` workflow only re-downloads and hash-verifies those pinned versions (opening a PR if anything changed); it does not bump them. To update, edit the version and recorded hash in `scripts/update_dependencies.py` and the CSS URLs in `scripts/fetch-vendor-css.js`, then review the generated PR.

## Checklist
1. Create the file using the front matter template.
2. Write the content following the conventions above.
3. Run `bundle exec jekyll build` and confirm it succeeds.
4. Confirm the AI disclosure appears (or is intentionally suppressed with `human_written: true`).
5. Review the accessibility and security sections above before publishing.
