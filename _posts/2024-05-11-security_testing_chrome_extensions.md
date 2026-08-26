---
layout:     post
title:      Security testing Chrome extensions
date:       2024-05-11 00:00:00
author:     Luke Wakefield
summary:    How I assess and approve Google Chrome extensions — the request process, CRXcavator risk scores, and automated URL scanning.
categories: security
thumbnail: magnifying-glass
tags:
 - chrome
 - extensions
 - security
 - crxcavator
 - virustotal
 - google
---

This page describes how I assess and approve Google Chrome extensions
before allowing them into the environment. It covers the request process,
the CRXcavator risk score, and automated URL (Uniform Resource Locator) scanning.

## Requesting a new extension

To request an extension that isn't already approved, follow Google's process
for [deploying apps and extensions][chrome-admin]:

<https://support.google.com/chrome/a/answer/10405494>

## CRXcavator risk score

I use [CRXcavator][crxcavator] (from Duo Security) to provide a risk score
and an overview for each extension (such as software vulnerabilities). The
score is calculated as follows:

<https://crxcavator.io/docs.html#/risk_breakdown>

Zero is the lowest limit, but there doesn't seem to be an upper limit, so
these numbers are for guidance only. Most data points only add a single
digit to the risk score, but a missing Content Security Policy (CSP) adds
377, so if an extension exceeds this score it may be worth looking at more
closely. Generally, scores below 500 are approved.

For example, this app has a score of just six:

<https://crxcavator.io/report/langpack-en-GB@firefox.mozilla.org/105.0buildid20220906.185728?platform=Firefox>

## VirusTotal URL watch

Using [Mrxcavator][mrxcavator], I automate the scanning of the external URLs
within the extensions (where explicitly listed). This helps to give a
clearer picture of an extension's safety. Where an extension is allowed
access to all sites, I've made a special note — this list includes Google
Safe Browsing.

[chrome-admin]: https://support.google.com/chrome/a/answer/10405494
[crxcavator]: https://crxcavator.io
[mrxcavator]: https://github.com/mstanislav/mrxcavator
