---
layout:     post
title:      Migrating to a password manager
date:       2022-11-05 00:00:00
author:     Luke Wakefield
summary:    A step-by-step guide to moving every account you own into a password manager — from choosing one, to exporting your mailbox, resetting passwords, and enabling MFA.
categories: security
thumbnail: book
tags:
 - password-manager
 - bitwarden
 - 1password
 - passwords
 - security
 - mfa
 - passkeys
 - email
---

This is the process I followed to migrate all of my online accounts into a
password manager. It's a bit of work up front (I had around 400 unique sites
to go through), but it's worth it: once you're done, every account has a
unique, strong password and the strongest multi-factor authentication (MFA)
available.

<br>
## 1. Pick a password manager

First, the most important point: **any password manager is better than no
password manager**. Reusing passwords (or using weak ones) across sites is how
accounts get taken over in bulk.

That said, a dedicated password manager is better than the one built into
your browser or into Google/Apple. Your Google or Apple account is already the
master key to most of your digital life — if that account is compromised, the
attacker can reset your other passwords via your inbox. This is exactly what
happened in the [well-known story of Mat Honan][mat-honan], whose Google
account was hacked and, from there, most of his other credentials and devices
were taken over too. Keeping your passwords in a separate, dedicated vault
(protected by its own master password) adds a layer of separation between your
email and your credentials.

I'd suggest either of these two:

* [**Bitwarden**][bitwarden] — open source, and has a generous free tier.
* [**1Password**][1password] — polished and easy to use.

<br>
## 2. Export your mailbox

The goal here is to get a full copy of your mailbox so you can find every
service that has ever emailed you.

### Gmail

Use [Google Takeout][takeout] to export your data:

1. Go to <https://takeout.google.com/>.
2. Click **Deselect all**, then select **Mail**.
3. Choose the export format and delivery method (a download link or a cloud
   drive), then create the export.

The mail is exported as an `.mbox` file. See Google's official
[Download your data][google-download] documentation for details.

### Outlook

Export your mailbox to a `.pst` file:

1. Open Outlook.
2. Go to **File → Open & Export → Import/Export**.
3. Choose **Export to a file → Outlook Data File (.pst)**, select the mailbox
   (including subfolders), and finish the export.

Microsoft's official walkthrough is here:
[Export emails, contacts, and calendar items to Outlook using a .pst file][outlook-export].

<br>
## 3. Extract the e-mail addresses

Once you have the mailbox file, extract every e-mail address in it.

* For an **Outlook `.pst`**, there's no built-in extractor, so use a script
  that reads the Messaging Application Programming Interface (MAPI) properties — for example
  [this `extract_email_addresses_from_pst.py`][extract-pst] gist, which uses
  the `pypff` library.
* For a **Gmail `.mbox`**, a simple `grep` gets you most of the way there:

```
grep -Eo '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' mailbox.mbox | sort -u > addresses.txt
```

This gives you a de-duplicated list of every address that's emailed you.

<br>
## 4. Extract the top-level domains

Most of those addresses are `noreply@...` or `updates@...` addresses, so the
part you actually care about is the domain. Use
[**tldextract**][tldextract] to pull out the registered domain from each
address:

```
pip install tldextract
```

```
import tldextract

with open("addresses.txt") as f:
    domains = sorted({tldextract.extract(line.strip()).registered_domain
                      for line in f if "@" in line})

with open("domains.txt", "w") as f:
    f.write("\n".join(domains))
```

Then drop the resulting list into a spreadsheet so you can keep track of your
progress. I had around **400 unique sites** to work through.

<br>
## 5. Reset each account's password

For each domain in your list, navigate to the website and:

1. Try to log in.
2. If you can't remember the password, use **Forgot Password** to have a reset
   link emailed to you.
3. Once you're in, add the URL (Uniform Resource Locator), your e-mail address, and a new password to
   your password manager.

### How long should the password be?

The official guidance is [SP 800-63B][nist] from the National Institute of Standards and Technology (NIST), which sets a minimum of
**8 characters** for user-chosen passwords and stresses that **length is the
most important factor** — more important than forcing a mix of character
types.

My own recommendation is one of the following:

* **14+ characters**, mixing lower-case, upper-case, numbers, and symbols; or
* **five words**, capitalised and separated by hyphens, plus a number
  (e.g. `River-Candle-Hammer-Garden-Cheese-77`) — these are far easier to type out.

**"Length is strength"** — this is the Hive Systems table showing roughly how
long it takes to brute-force a password offline (assuming a rented fleet of
RTX 5090s and bcrypt-hashed passwords):

![Hive Systems 2026 Password Table — how long it takes to crack passwords](/images/migrating-to-a-password-manager/hive-systems-password-table.png)

*Source: [Hive Systems — Are Your Passwords in the Green?][hive-systems] (2026
edition).*

Even a short password of the "full mix" (numbers, upper, lower, and symbols)
takes over a century to crack with this setup — but the crack times get
shorter every year as hardware improves, so err on the longer side.

Your password manager can generate these for you automatically. If you need
to type the password by hand, ask it to avoid ambiguous characters such as
`O`, `0`, `I`, `l`, and `1`.

### 5.1. What if the account no longer exists?

If the account is gone, just move on. Sometimes it's worth searching your
mailbox for the domain to see what you received from it in the past — but
often the domain simply no longer exists, or it was a mailing list where you
never created a password in the first place.

<br>
## 6. Update your e-mail address

While you're in each account, consider changing the e-mail address on file to
a unique one per service:

* If you have your own domain, use `service@yourdomain.com`.
* Otherwise, use the **plus trick** — most providers (like Gmail) let you
  append `+something` to your address, e.g. `youremail+service@gmail.com`.

This makes it easy to spot which service leaked or sold your address, and
makes targeted phishing slightly harder.

<br>
## 7. Enable the strongest MFA you can

Finally, add multi-factor authentication to each account. In order of
preference:

1. **Passkeys** — the strongest option. Password managers can store passkeys,
   which is preferable to Google's built-in passkey solution because they're
   portable across devices and ecosystems.
2. **One-time passwords (OTP)** — codes from an authenticator app.
3. **E-mail** — a code emailed to you.
4. **SMS** (Short Message Service) — a code texted to you.

Any MFA is better than no MFA, so if a site only offers SMS, take it — but
upgrade to a passkey or an authenticator app wherever you can.

[mat-honan]: https://www.wired.com/2012/08/apple-amazon-mat-honan-hacking/
[bitwarden]: https://bitwarden.com/
[1password]: https://1password.com/
[takeout]: https://takeout.google.com/
[google-download]: https://support.google.com/accounts/answer/3024190
[outlook-export]: https://support.microsoft.com/en-us/office/export-emails-contacts-and-calendar-items-to-outlook-using-a-pst-file-14252b52-3075-4e9b-be4e-ff9ef1068f4c
[extract-pst]: https://gist.github.com/SjoerdHilhorst/6956b48a0d75931bcb5831c07f44a020
[tldextract]: https://github.com/john-kurkowski/tldextract
[nist]: https://pages.nist.gov/800-63-3/sp800-63b.html
[hive-systems]: https://www.hivesystems.com/blog/are-your-passwords-in-the-green
