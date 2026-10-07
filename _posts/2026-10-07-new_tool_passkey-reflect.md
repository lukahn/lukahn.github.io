---
layout:     post
title:      "New tool: passkey-reflect"
date:       2026-10-07 00:00:00
author:     Luke Wakefield
summary:    I built passkey-reflect to show what actually happens during a passkey ceremony — the challenge, the attestation, and the public key a website would store.
categories: security
thumbnail: toolbox
tags:
 - passkeys
 - webauthn
 - fido2
 - bitwarden
 - yubikey
 - security
---

I've been interested in FIDO2 security keys since the YubiKey first showed up. A hardware token that signs a challenge with a private key it never lets go of is a much better answer to authentication than a shared secret, and that idea stuck with me. The problem was practical: I had to carry the thing around. Even as someone who works in security, remembering a physical key — and having it with me at the moment a site asked for it — was annoying enough that I'd usually fall back to a password and a one-time code (OTP).

Passkeys are the fix for that. A passkey is the same kind of FIDO2 credential, but it lives in software rather than on a physical key, so it keeps the property I actually wanted — the private key never leaves the device holding it — without the tether. For a while, though, the only realistic place to keep one was a Google account, which just swapped one kind of lock-in for another. Then Bitwarden added passkey support, and passkeys became portable again: the credential could sit in the password manager I already carry everywhere.

That's what made me want to look under the bonnet. It's one thing to know the private key stays put; it's another to see what the keys actually look like and what a website is really handed at the end of a ceremony. I wrote up the first half of that on Reddit, where I pulled apart [how Bitwarden stores passkey data and how to view it][bitwarden-data] — including how friendly Base64 encoding is to certain symbols.

I could get the private key out of the Bitwarden command-line interface (CLI), but the public key wasn't shown anywhere. So I built passkey-reflect to hand all of it back to whoever uses it.

<br>
## What passkey-reflect shows

passkey-reflect is a WebAuthn demo, a bit like [webauthn.io][webauthn], except that where most demos stop at "it worked", this one shows you the material the ceremony produced — and the subset of it that a website would normally keep in its database.

You create a passkey, and the page decodes the result:

* **The public key** in four forms: the raw CBOR Object Signing and Encryption (COSE) bytes, the COSE member map decoded field by field, a JSON Web Key (JWK), and a Privacy-Enhanced Mail (PEM) `SubjectPublicKeyInfo`, each with its SHA-256 fingerprint and RFC 7638 thumbprint.
* **What the server asked for** — the creation options it issued, reconstructed from its own stored challenge record, so you can compare the request with what came back.
* **Client data** — the decoded `clientDataJSON`, including the challenge and the origin the credential was bound to.
* **The attestation object** — the raw Concise Binary Object Representation (CBOR), the decoded structure, and any certificate inside it with its subject, issuer, validity and fingerprint.
* **authenticatorData** — the `rpIdHash` next to the hash the server expected, every flag bit with its meaning, the signature counter, the Authenticator Attestation Globally Unique Identifier (AAGUID) and the credential ID.
* **What the browser sent back** — verbatim what your browser posted, labelled as the browser's claim rather than as something the server has verified.

Then you use the passkey to sign in, and you can watch the signature arrive, see it verified against the public key, and watch the signature counter move.

The parts a relying party actually stores are the ones worth noticing: the credential ID, the public key, the counter and the transports. The private key never appears — it stays with the authenticator — which is the whole point.

<br>
## Nothing is stored

passkey-reflect keeps no user data. There is no database, no cache and no file on the server: everything it needs between two requests travels in a single AES-256-GCM sealed cookie, and nothing is written to disk. Each request for the page rotates the session, there is an **End session now** button, and the cookie is session-scoped with no `Max-Age` or `Expires`, so the browser drops it when the browser closes. The container runs with a read-only filesystem and no volumes, so "nothing survives" is enforced by the deployment rather than left to good intentions.

The practical consequence is that one visitor cannot reach another visitor's session — there is no store to look one up in — and there is no stored record to leak or recover afterwards.

<br>
## Try it

You can run a ceremony against your own passkey at <https://passkey-reflect.lukahn.com/>.

It's a demonstration rather than a production identity system, so read the explanations against the specifications rather than as authority.

<br>
## References

* Bitwarden passkey data — how to view — [Reddit post][bitwarden-data]
* WebAuthn demo — [webauthn.io][webauthn]
* passkey-reflect — <https://passkey-reflect.lukahn.com/>

[bitwarden-data]: https://www.reddit.com/r/Bitwarden/comments/1b0zi3u/bitwarden_passkey_data_how_to_view/
[webauthn]: https://webauthn.io/
