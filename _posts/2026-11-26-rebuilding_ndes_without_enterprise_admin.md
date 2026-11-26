---
layout:     post
title:      "Rebuilding NDES without Enterprise Admin"
date:       2026-11-26 00:00:00
author:     Luke Wakefield
summary:    NDES is normally installed by a wizard that asks for Enterprise Admin. I measured what the install actually changes across three servers, then rebuilt it from a bundle — the administrator requirement turned out to be a permissions workaround, not a functional one.
categories: security
thumbnail: certificate
tags:
 - ndes
 - scep
 - active-directory
 - certificate-services
 - pki
 - iis
 - powershell
---

Network Device Enrollment Service (NDES) is Microsoft's SCEP server: it lets devices that have no domain account — phones, routers, anything with a SCEP client — collect a certificate from an enterprise CA. It ships as a role service, and it configures itself through a wizard.

That wizard wants Enterprise Admin. Two things bother me about that. The first is the privilege itself: a service that hands out certificates to unauthenticated devices shouldn't need forest-wide administrative rights to install. The second is what it costs operationally. Rebuilding an NDES server means running the wizard again, and the wizard leaves you with a freshly configured server that looks nothing like the one you had — no Server Manager history, no IIS configuration you recognise, and a set of choices you have to remember and re-enter.

So the question I wanted answered was: what does the wizard actually *do*, and is Enterprise Admin really load-bearing? The short answer is that it does less than you'd think, and no.

## Measuring it instead of guessing

Guessing was not going to work. NDES touches a bit of everything — roles and features, the registry, IIS, the certificate store, and Active Directory — and the documentation describes settings without telling you what changes when the wizard runs.

So I built a capture kit and measured it. Three lab VMs: a domain controller, a CA, and the NDES server. Take a snapshot of all three with users, groups and templates already in place, run the NDES install end to end as Enterprise Admin, snapshot again, and diff everything: every registry key, every file with its hash and access control list, services, firewall rules, scheduled tasks, features, and both Active Directory naming contexts exported through `ldifde`.

The install turns out to be small. What follows is what it actually did.

## What the install actually changes

**Roles and features.** The build needs 39 individual feature leaves, which install 57 features in total: the 39 themselves, 12 more that arrive on any fresh server, and 6 parent features that come along as dependencies. That distinction matters, because `Install-WindowsFeature` installs a feature *and its default children*. Ask for `AD-Certificate` and you get the Certificate Authority role service as well; ask for `RSAT` and you get every RSAT tool there is. Ask for the leaves and you get exactly the reference build.

**Registry.** Three keys, twelve values. `HKLM\SOFTWARE\Microsoft\Cryptography\MSCEP` holds nine of them, including the CA configuration string, the template names, and whether the RA certificates live in the machine store. `HKLM\SOFTWARE\Microsoft\ADCS\NDES` holds a single post-deployment status value, and `HKLM\SYSTEM\CurrentControlSet\Services\HTTP\Parameters` gets the two `http.sys` limits that let large SCEP requests through.

**IIS.** A `SCEP` application pool, two applications (`/CertSrv/mscep` for devices, `/CertSrv/mscep_admin` for challenge passwords), per-application settings, an ISAPI restriction, and a handler ordering rule.

**Certificates.** Two Registration Authority certificates and one server certificate — but these are *re-issued*, never copied. They are per-server, and nothing machine-specific needs to move.

That is the whole footprint. Nothing in it requires Enterprise Admin to write.

## What Enterprise Admin was actually for

This is the part I most wanted to see, so I diffed the domain controller's two naming contexts across the install window. Three changes appeared, and only three:

| Partition | Object | Change |
| --- | --- | --- |
| Domain | `CN=svc_ndes,CN=Users` | `servicePrincipalName: http/ndes.contoso.com` added |
| Domain | `CN=svc_ndes,CN=Users` | `userCertificate` added |
| Configuration | `CN=CONTOSO-SUBCA,CN=Enrollment Services,…` | `certificateTemplates: IPSECIntermediateOffline` added |

No objects created. No objects deleted. No group membership changed. Every other difference between the two exports was `lastLogon` and `logonCount` noise from machines logging on.

So the wizard did nothing *structural* to Active Directory. Enterprise Admin was never about a directory right. It was about **enrolment**: the wizard has to obtain the RA certificates, and whether the CA issues them depends on the template's access control list and the CA's own permissions. The default templates grant Enroll to privileged humans rather than to service accounts, so the wizard is run as one. Enterprise Admin is the shortest path to "this identity can enrol", not a requirement of the product.

Which suggests the obvious alternative: give Enroll to something more appropriate and enrol as that instead. The CA database records the requester of every request, so you can watch this change. In the lab, the wizard produced requests from the Enterprise Admin account; the rebuild produces the same certificates requested by the NDES server's **computer account**. `Get-Certificate -CertStoreLocation LocalMachine\My` always runs in machine context, whatever credential you supply, so the RA templates simply need Enroll for the servers — a group is enough.

Two incidental findings from that diff are worth knowing, because both follow the service account around:

* The `userCertificate` is not an RA certificate. It is a SCEP-issued *device* certificate, published into Active Directory because that template has "Publish certificate in Active Directory" ticked. NDES submits SCEP requests as its own service account, so device certificates accumulate on that account's directory object. If you use a group Managed Service Account, they accumulate there instead.
* The `HTTP/` service principal name lands on the **app pool identity**, not the computer account. That matters when the pool runs as a gMSA, because nothing that would normally do the registration can log on as a managed account — so it has to be registered explicitly.

## The template that was never published

One thing I had wrong, and it is the detail most likely to waste your afternoon.

Publishing a template on a CA means adding it to the `certificateTemplates` attribute on the CA's `pKIEnrollmentService` object. It is what makes the template appear in the CA console and in Web Enrollment, and the usual advice is that you must publish the RA templates before NDES will work.

In this lab, the templates published on the CA before the install were: `DirectoryEmailReplication`, `DomainControllerAuthentication`, `KerberosAuthentication`, `EFSRecovery`, `EFS`, `DomainController`, `WebServer`, `Machine`, `User`, `SubCA`, `Administrator`, `EnrollmentAgentOffline`, `CEPEncryption`, `NDESServer` and `NDESUser`.

`MachineEnrollmentAgent` — the signing template the rebuild uses — is not on that list. It never was. And the CA issued from it anyway, repeatedly, to both the Enterprise Admin account during the original wizard run and the computer account during the rebuild. The issued certificates are in the CA database with that template name against them.

The pattern held for the whole rebuild: the migration script never publishes a template on the CA, and the SCEP enrolment worked end to end.

The practical reading is that **publication governs what the CA advertises, not whether it will issue**. A request that names a template object the CA can read is decided by that template's ACL and the CA's permissions. Publication is what drives the lists — the CA console, Web Enrollment, autoenrollment policy — and those paths do need it. A direct enrolment request does not.

I would not build a design on that alone, because "it worked for me" is not a specification. But it is the difference between granting a service account Enroll on one template and granting an administrator the ability to reconfigure a CA.

## Things that cost the most time

None of these are in the documentation, and all of them presented as something else:

* **IIS serves `mscep.dll` as a file when the ISAPI isn't allowed to execute.** The response is `HTTP 200` with a Windows executable in the body, and every diagnostic about certificates is a red herring. The per-application `handlers accessPolicy` has to include `Execute`; the inherited default (`Read, Script`) silently skips the ISAPI handler and hands the request to StaticFile.
* **The SCEP admin page's refusal is also `HTTP 200`.** "You do not have sufficient permission to enroll with SCEP" renders as a normal page with a success status code, so a comparison that checks status codes reports a match. The tell is the body: the real page contains the word "password" and sixteen hex digits; the refusal does not.
* **`mscep.dll` has no permission check of its own.** It imports `certca.dll` and `certcli.dll` and calls the CA, and *any* failure of that call renders that same page. Checking the caller's group membership tells you nothing — it is almost always the service account's right to request certificates on the CA, or its access to the RA private keys.
* **Deleting a Server Manager cache entry makes a role service uninstallable.** `Get-WindowsFeature` and `Install-WindowsFeature` both enumerate role services from `HKLM\SOFTWARE\Microsoft\ServerManager\ServicingStorage\ServerComponentCache`, so deleting an entry to "reset" the post-deployment tile removes the feature from the catalogue. Touch the timestamp instead.
* **A gMSA app pool needs the password attribute to be absent, not empty.** `appcmd` accepts an empty password, reports success, and leaves any previous value in place — and IIS encrypts whatever it is given, so an empty password is stored as non-empty ciphertext. The attribute has to be removed from `applicationHost.config`, which is what the working configuration looks like anyway.
* **A new KDS root key is not usable for about ten hours.** Domain controllers wait so that the key can replicate everywhere before gMSA passwords are derived, and `Add-KdsRootKey -EffectiveImmediately` starts that clock rather than stopping it. In a lab, create it with an effective time in the past.

## What this doesn't do

It is not disaster recovery. Certificates are re-issued rather than restored, so the rebuilt server has different RA and server certificates from the one it replaces — same roles, same trust, different keys. That is deliberate: copying private keys between servers is the thing you would have to do otherwise, and it is worse.

It also assumes the CA and the directory are already where they should be. The bundle carries the NDES server's configuration, not the PKI it depends on.

## Where it is

The capture kit, the migration script and a SCEP enrolment tester are on GitHub at <https://github.com/lukahn/ndes-backup-and-restore>, under an MIT licence. The README documents the failure modes above in more detail than is reasonable for a blog post, including the ones that were my own fault.

## References

* Group Managed Service Accounts overview — [Microsoft Learn][gmsa]
* Create a Key Distribution Services root key — [Microsoft Learn][kds]
* Application Pool Identities — [Microsoft Learn][apppool]

[gmsa]: https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview
[kds]: https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/create-the-key-distribution-services-kds-root-key
[apppool]: https://learn.microsoft.com/en-us/iis/manage/configuring-security/application-pool-identities
