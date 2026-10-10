---
layout:     post
title:      "New tool: cert-scanner"
date:       2026-10-10 00:00:00
author:     Luke Wakefield
summary:    "I built cert-scanner to answer one question well: which certificates exist for a name, and whether the one being served right now is healthy."
categories: security
thumbnail: toolbox
tags:
 - certificates
 - certificate-transparency
 - tls
 - crl
 - pqc
 - security
---

Certificate Transparency (CT) logs are public, append-only, and full of surprises. Every certificate a certificate authority (CA) issues is meant to be recorded there, and because the logs can be searched, you can find out which certificates exist for a name — not only the one a server is presenting right now, but every one that was ever issued. That includes certificates that have expired, certificates that were issued and never deployed, and certificates for a hostname you had forgotten about. The last category is the one that matters, because a certificate you have forgotten is still a certificate somebody can present.

I had used crt.sh on and off for years for exactly that, but a one-off search does not remember anything. What I wanted was something that kept the history, watched a target over time, and told me when the certificate actually in use was getting close to expiry. That is cert-scanner.

<br>
## One question, answered well

cert-scanner answers a single question: **which certificates exist for this name, and is the one being served right now healthy?**

You give it a domain, an IP address, or an Autonomous System Number (ASN). A domain search finds that name in the logs, with an option to include every subdomain. An IP address is read for the certificate it is serving now, and the names on that certificate are then searched for. An ASN runs the other way round — the network's announced prefixes are resolved back to hostnames and each one is searched — which is why it is deliberately a two-step action: it can cover thousands of hosts.

It shows the whole certificate history, not just what is live. Expired certificates and certificates that were issued but never deployed are included, because one you have forgotten is still one somebody could present. You can paste many targets at once, one per line, with duplicates skipped; each becomes its own scan so you can compare them individually later.

The data comes from the public CT logs, read through [crt.sh][crtsh] first and [Cert Spotter][certspotter] if crt.sh is unavailable. Two things I wanted to get right here: the requests are paced and retried politely, and if neither source can be reached the scan **fails and says so**, rather than reporting "no certificates found" — which would look exactly like good news.

<br>
## Warnings you can act on

Each hostname gets a card showing the certificate it is serving now, its issuer and validity window, and its status. Cards expand to the full history of certificates issued for that hostname, with the in-use or most recently issued one first.

| Warning | What it means |
| --- | --- |
| **Expired** | Past its expiry date. The date turns red and is suffixed. |
| **Wrong certificate** | The live certificate does not cover the hostname it is served for. |
| **Revoked** | The issuer has withdrawn it, checked against the certificate's Certificate Revocation List (CRL). |
| **Expires soon** | In use and inside the warning window you set. Amber, with the days remaining. |
| **Revocation unknown** | The status could not be established, and the page says which reason applied rather than quietly implying the certificate is fine. |

Around that, a few things make the list usable rather than overwhelming. You can filter on any column, with the values that actually exist offered as Excel-style suggestions, so you filter by what is there rather than by what you guess. Expired certificates are hidden by default, with a sub-toggle to keep the expired ones that are still in use. The columns are configurable — drag them into the order you want, or use the move buttons that do the same thing without dragging — and the layout is saved to your account. The whole scan exports to CSV (Comma-Separated Values), and there is a second export of just the table as you have arranged it, so a downloaded file cannot disagree with what is on screen. Any row's certificate can be downloaded as a PEM (Privacy-Enhanced Mail) file.

Two smaller touches I care about: the colour legend is written out in words, so nothing depends on telling shades apart, and issuer names are readable — a chain through `R11` or `WE1` is shown as `Let's Encrypt (R11)`, with the full distinguished name on hover. Every date is written `yyyy/mm/dd`, and every time says whose clock it is on.

<br>
## The live check, and what the ciphers say

Three checks are optional and off by default, because each one costs extra connections to the target.

**The live check** establishes which certificate a host is actually serving by connecting to it. That is what separates a certificate that *is* deployed from one that merely *exists*: `Live` from the handshake, `Assumed` when the host did not answer, or `not checked` on a scan that ran without it. A blank column is never shown as "nothing is in use".

**The cipher check** enumerates the TLS 1.2 and 1.3 cipher suites a server negotiates, grades each one in the style of SSL Labs or `ssl-enum-ciphers`, gives the hostname an overall grade, and lists concrete improvement steps. TLS 1.2 ciphers that are being retired are marked in red, with the reason on hover or focus and the criteria listed above the table. The marks name the document they come from — [RFC 10015][rfc10015] and [RFC 9325][rfc9325] — rather than a date, because the date is the browser vendors' to publish and guessing it would be wrong in a way you could not check.

**The post-quantum (PQC) check** flags certificates issued with post-quantum algorithms such as `ML-DSA-44`, and shows them as a badge. Detection of post-quantum cipher suites is implemented, but there is nothing for it to find in the default build yet: it needs a TLS library that offers those suites, and the one this runs does not.

<br>
## Watching a target over time

The scanning list is what you watch; a scan is what you saw. Every run is stored separately as a frozen snapshot, so you can come back later and compare. Scheduling is daily, weekly (pick the weekday), monthly (pick the date), yearly (pick the month and date), or your own five-field cron expression, and a preview shows the next few run times before you save, so a schedule you cannot picture is never saved blind. Schedules run in UTC whatever time zone you display.

A running scan reports what it is doing at that moment — `crt.sh: downloading certificate 16/100`, `probing www.example.com (4/20)` — streamed to the page as it happens, rather than just saying it is busy. And every scan can be compared with its predecessor.

<br>
## What changed since last time

Every scan produces a change list: new, changed, and removed certificates and cipher suites, viewable from the results page. After a scheduled scan, the same differences are emailed to you, and only when something actually changed — so you do not have to visit to find out that nothing did. The emailed report uses the same switch as the expiry alerts, deliberately, because the unsubscribe link has to opt you out of everything; a second switch could leave some mail still arriving.

<br>
## Alerts on your own ladder

Alerts cover certificates that are in use and due to expire, or already expired. The part I like is that there is **no default warning ladder**: "Warn before expiry" takes a list of thresholds in days, such as `30,15,7,6,5,4,3,2,1`, and sends one email as each threshold is crossed, so a long list warns you repeatedly without repeating itself. The widest value is also the window that marks in-use certificates as "Expires soon". An account that chooses no thresholds gets no advance warnings, rather than a number it did not pick, and clearing the field means what it says. An already-expired certificate still emails once while alerts are switched on, because alerts being on is what sends mail.

<br>
## Signing in without a password

There is no password to choose, forget, or reuse. An account is created the first time you sign in, so there is nothing to register for. Sign-in is with a passkey (WebAuthn) — the fingerprint reader, face, or security key already on your device — or an emailed one-time code (OTP) for when a passkey is not available: six digits, valid for a short window, with limits on attempts and on how often one can be requested. Once you have a passkey you can remove your email address entirely and sign in with the passkey alone. Signing out ends the session on the server, not just in the browser.

In your account you can rename yourself, change your email address (proved by a code sent to the new one), list your passkeys, give each a nickname so you know which device it is, rename or remove them, export everything the account holds, or delete the account outright. The last passkey cannot be removed if doing so would lock you out.

<br>
## What it holds, and what it refuses to hold

Some of this is deliberately unusual. No IP addresses and no user agent are recorded against your account, and the privacy notice says so. Sensitive actions are recorded in an audit trail — which account, which action, when — with no address or user agent attached. There is no analytics, no third-party script, no tracking pixel, and no advertising.

Sessions are stored as hashes, so a database read does not yield a usable cookie; every state-changing request is protected against cross-site request forgery (CSRF); and every query is scoped to the account that owns the row. Traffic is HTTPS only, with HTTP Strict Transport Security (HSTS) for 180 days including subdomains and with `preload`, and the Content Security Policy is `default-src 'none'` with every source named — so no third-party host can be loaded, even if something tried to inject one — and the page cannot be framed.

Retention is enforced rather than intended: an account is deleted two years after its last sign-in, with everything in it, and you can delete it sooner. One exception is named in the privacy notice: the record of account actions is kept for up to a year, with no address or username in it, because a trail that vanished with its subject could not answer the question it exists for.

<br>
## Plain, and predictable by default

The interface is meant to stay out of the way. Any time zone can be chosen from the header (UTC by default), and a timestamp is never shown without its zone. There are light and dark themes, following your system unless you choose otherwise, and applied before the first paint so there is no flash. It is keyboard-operable throughout, with a visible focus indicator, a skip link, and colour never used as the only signal — every colour is paired with words. And it is deliberately plain: no infinite scrolling, no autoplay, no motion you did not ask for, and no modal dialogs, because confirmations appear on the page next to the thing they are about rather than in a box you have to escape.

A few limits are worth knowing up front. There are 10 scans per hour per account, so one account cannot take the whole capacity. An ASN scan counts as one scan however many hosts it covers. Probes time out after 5 seconds each, so a slow or unreachable host is reported as unresponsive rather than holding a worker. And CT is not instant — a certificate issued in the last few minutes may not have reached the logs yet.

<br>
## Try it

cert-scanner is running at <https://cert-scanner.lukahn.com/>. It is written by an AI assistant from a specification, and it has not been independently audited — the site says so on every page, and the source is public — so read the explanations against the specifications rather than as authority.

<br>
## References

* cert-scanner — <https://cert-scanner.lukahn.com/>
* Features — [features.md][features]
* Source code — [github.com/lukahn/cert-scanner][repo]
* crt.sh — [crt.sh][crtsh]
* Cert Spotter — [Cert Spotter][certspotter]
* Deprecating obsolete key exchange methods in TLS 1.2 and DTLS 1.2 — [RFC 10015][rfc10015]
* Recommendations for secure use of TLS and DTLS — [RFC 9325][rfc9325]

[features]: https://github.com/lukahn/cert-scanner/blob/main/features.md
[repo]: https://github.com/lukahn/cert-scanner
[crtsh]: https://crt.sh/
[certspotter]: https://sslmate.com/certspotter/
[rfc10015]: https://www.rfc-editor.org/rfc/rfc10015
[rfc9325]: https://www.rfc-editor.org/rfc/rfc9325
