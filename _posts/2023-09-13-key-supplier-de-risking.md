---
layout:     post
title:      Key Supplier De-Risking
date:       2023-09-13 00:00:00
author:     Luke Wakefield
summary:    A lightweight approach to checking that key suppliers have basic security controls in place, with a list of questions to ask.
categories: security
thumbnail: magnifying-glass
tags:
 - security
 - suppliers
 - third-party
 - vendor-risk
 - procurement
 - questionnaire
---

The 2023 Latitude Financial breach was a useful reminder of how much access
outsourced partners often have to customer data and production systems. A
striking quote from the reporting at the time:

> An administrative user had logged in from DXC (an IT services provider), and
> was doing something that DXC admins don't usually do. It's not clear what
> activity tripped the scanner, but by the time Latitude had shut down its
> connection to its upstream service provider, the user had already logged onto
> the systems of at least two other Latitude service providers, and exfiltrated
> data belonging to hundreds of thousands of Latitude customers.

Other companies responded by:

* Using jump boxes with multi-factor authentication (MFA) managed by the client.
* Developing an in-depth understanding of how their service providers secure
  their own environment and staff.
* Clarifying what the service provider defines as a notifiable incident.
* Treating suppliers as untrusted: "They cannot connect directly and we're
  managing the MFA."
* "We're putting all our controls in their environment."

Even if you don't outsource IT or networking, you likely have partners with
privileged access. This page describes a lightweight approach to understanding
whether your key suppliers have basic controls in place, and intervening if
they don't.

## Questions to ask

| Question | Context |
|---|---|
| What systems and data do [Supplier] staff access? | |
| Do [Supplier] staff exclusively use company-issued workstations (laptops) to access our systems? If not, please describe who owns and manages them? | Workstation compromise is how many modern breaches start, so these need to be strongly controlled. |
| Briefly describe how the following concerns are managed with regard to workstations used to access our systems: 1. Patching, 2. Disk encryption, 3. Anti-malware, 4. Password management, 5. Remote deletion/wipe | |
| What operating system and software do [Supplier] staff run on their workstations (laptops)? | |
| What happens when [Supplier] staff leave? How and when are we notified? How and when is their access revoked to [Supplier] devices and accounts? | |
| Is multi-factor authentication required and enforced to log in to [Supplier] corporate email accounts? | |

## Follow ups

Once you understand the level of risk and which controls are in place, you can
decide how to proceed — for example, requesting changes from the supplier,
adding compensating controls, or accepting the residual risk.
