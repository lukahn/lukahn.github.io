---
layout:     post
title:      Handy OpenSSL commands
date:       2020-10-01 13:15:00
author:     Luke Wakefield
summary:    A compilation of useful OpenSSL and keytool commands for working with SSL certificates and keys.
categories: openssl
thumbnail: heart
tags:
 - openssl
 - keytool
 - ssl
 - tls
 - certificates
 - csr
 - java
---

This page is a collection of OpenSSL and `keytool` commands that I regularly
use for creating, managing, and testing certificates and keys for SSL (Secure Sockets Layer) and TLS (Transport Layer Security). Most
of the examples use `example.com` as a placeholder, so replace it with your own
domain.

<br>
## X509 Certificates

### Check a Certificate Signing Request (CSR)

This is used to verify that the CSR contains all of the fields we're
expecting, mainly in the SAN (X509v3 Subject Alternative Name) section.

```
openssl req -text -noout -verify -in example.com.csr
```

### Check a private key

This is mainly used to check the Modulus section. We can verify that the
certificate matches the private key by checking that the Modulus fields in
both match.

```
openssl rsa -check -text -noout -in example.com.key
```

### Check a certificate

If the file contains multiple certificates (a bundle), then this command will
only show the details of the first one (it stops whenever it reads the
`END CERTIFICATE` section). The first certificate in a chain is always the
endpoint one. The order is: Endpoint -> Intermediate(s) -> Root.

#### PEM/CRT Base-64 encoded

PEM (Privacy-Enhanced Mail) is the most common type of certificate format. If the file contains
readable text (notably `START CERTIFICATE`), then this is the command to use.

```
openssl x509 -text -noout -in example.com.crt
```

#### CER/DER encoded binary

DER (Distinguished Encoding Rules) is the binary format. If the certificate is a binary file, then use this.

```
openssl x509 -text -noout -inform der -in example.com.cer
```

#### Check a bundle

```
openssl crl2pkcs7 -nocrl -certfile bundle.pem | openssl pkcs7 -print_certs -noout
```

#### Convert a certificate format

Replace the extensions with whatever is appropriate. Normally it's `.cer`
for DER files and `.pem` for PEM files, but I like `.crt` as `.pem` is
usually associated with bundles.

```
openssl x509 -inform der -in example.com.cer -outform pem -out example.com.crt
```

#### View contents of a .pfx file (PKCS#12)

This file format is encrypted with a password, and consists of the following
files (in order): endpoint certificate, intermediate certificate, root
certificate, private key. We can see the contents by running the following
(and entering the password):

```
openssl pkcs12 -in certificate.pfx -out /dev/stdout
```

#### Export certificate from a .pfx file

```
openssl pkcs12 -in example.com.pfx -out example.com.cer -nodes
```

#### Export a private key from a .pfx file

```
openssl pkcs12 -in example.com.pfx -nocerts -out example.com.key -nodes
```

We can chain this output with other openssl commands. For example, to get the
modulus of the key in a `.pfx` file in one go:

```
openssl pkcs12 -in example.com.pfx -nocerts -out /dev/stdout -nodes | openssl rsa -noout -in /dev/stdin -modulus
```

#### Create a new .pfx file

```
openssl pkcs12 -export -out example.com.pfx -inkey example.com.key -in example.com.crt -certfile CABundle.crt
```

### Check a certificate chain

To verify that the whole chain is correct (mainly when seeing a new
intermediate), you can run the following. Note: `openssl verify` stops at the
first self-signed certificate (normally the root, but it can also be the
intermediate), so `-untrusted` is needed to check the rest of the chain.

#### Intermediate and Root bundle

```
openssl verify -CAfile bundle.pem example.com.crt
```

#### Individual files

```
openssl verify -CAfile root.crt -untrusted intermediate.crt example.com.crt
```

### Check a PKCS#12 file (.pfx or .p12)

```
openssl pkcs12 -info -in keyStore.p12
```

### Check the certificate on a website

These commands can be used to verify the certificate(s) that a server is
sending. This can also be useful if a website instantly redirects before you
can check it in a regular browser session, or if you want to check whether
it's sending the whole chain.

#### Check an endpoint certificate

```
echo | openssl s_client -showcerts -servername example.com -connect example.com:443 2>/dev/null | openssl x509 -inform pem -noout -text
```

#### Check the full chain from a website

The number `5` here refers to the maximum certificates it should look at from
the chain; 5 should almost always be enough to cover an entire chain. A
website only needs to send the endpoint certificate (as the client will look
up any missing intermediates/roots in its local certificate store), but this
may cause compatibility issues if the client doesn't have them (e.g. older
devices, or a new intermediate or root certificate authority (CA)). This also improves the score on
[SSL Labs][ssllabs].

```
openssl s_client -security_debug_verbose -showcerts -verify 5 -connect example.com:443 < /dev/null
```

#### Check a load balancer

The `-servername` field is optional (and is usually the same as the value in
`-connect`), but we can use it when testing slightly more complex setups
(such as load balancers). We can replace the `-connect` value if testing an
individual load balancer. In the example below, I'm assuming a domain of
`example.com` served from a pair of load balancers with IP addresses `1.1.1.1`
and `1.1.1.2`. This can be useful if you want to update and test the
certificate on one load balancer before applying it to the other one.

```
openssl s_client -security_debug_verbose -showcerts -verify 5 -servername example.com -connect 1.1.1.1:443 < /dev/null
openssl s_client -security_debug_verbose -showcerts -verify 5 -servername example.com -connect 1.1.1.2:443 < /dev/null
```

### Create a new CSR

Note: replace all instances of `example.com` with the desired domain. You can add
more Domain Name System (DNS) entries by following the format, or remove them as required, but
you'll need at least one.

#### As of OpenSSL >= 1.1.1

Using an existing key:

```
openssl req -new -subj "/C=AU/ST=New South Wales/L=Sydney/O=Example/OU=IT Operations/CN=example.com" \
-sha256 \
-addext "subjectAltName = DNS:example.com, DNS:example.com.au" \
-addext "extendedKeyUsage = serverAuth, clientAuth" \
-key example.com.key \
-out example.com.csr
```

Or create a new key:

```
openssl req -new -subj "/C=AU/ST=New South Wales/L=Sydney/O=Example/OU=IT Operations/CN=example.com" \
-sha256 \
-addext "subjectAltName = DNS:example.com, DNS:example.com.au" \
-addext "extendedKeyUsage = serverAuth, clientAuth" \
-newkey rsa:4096 -nodes \
-keyout example.com.key \
-out example.com.csr
```

#### Or using OpenSSL < 1.1.1

Make a new file called `san.cnf` with the following contents (replacing the
DNS entries, or adding more by incrementing the number):

```
[ req ]
distinguished_name = req_distinguished_name
req_extensions = req_ext

[ req_distinguished_name ]

[ req_ext ]
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = example.com
DNS.2 = example.com.au
```

Using an existing key:

```
openssl req -new -subj "/C=AU/ST=New South Wales/L=Sydney/O=Example/OU=IT Operations/CN=example.com" \
-config san.cnf \
-sha256 \
-key example.com.key \
-out example.com.csr
```

Or create a new key:

```
openssl req -new -subj "/C=AU/ST=New South Wales/L=Sydney/O=Example/OU=IT Operations/CN=example.com" \
-config san.cnf \
-sha256 \
-newkey rsa:4096 -nodes \
-keyout example.com.key \
-out example.com.csr
```

#### Verify

```
openssl req -text -noout -verify -in example.com.csr
```

<br>
## Working with CAs

The following section can be used for setting up a basic Certificate
Authority (CA) for testing.

### Generate a standalone key (4096 bits)

```
openssl genrsa -out example.com.key 4096
```

### Extract the public key (for self signing certs)

```
openssl rsa -in example.com.key -outform PEM -pubout -out example.com.pem
```

### Sign a CSR

```
openssl x509 -req -days 360 -in example.com.csr -signkey example.com.key -out example.com.crt
```

<br>
## Java keystores

### List keys in a keystore

Note: the date here is the creation time of the alias.

```
keytool -list -keystore identity.jks
```

To get the actual certificate start/end dates, add the verbose flag:

```
keytool -list -v -keystore identity.jks
```

### Add a certificate to a keystore

```
keytool -import -trustcacerts -alias alias -file certificate.cer -keystore truststore.jks
```

### Remove a certificate from a keystore

```
keytool -delete -alias alias -keystore truststore.jks
```

### Extract a key from a keystore

```
keytool -importkeystore -srckeystore identity.jks -srcstorepass storepassword -srckeypass keypassword -srcalias alias -destalias alias -destkeystore identity.p12 -deststoretype PKCS12 -deststorepass password -destkeypass password
openssl pkcs12 -in identity.p12 -nodes -nocerts -out private_key.pem
```

### Add key to keystore

```
keytool -importkeystore -deststorepass '' -destkeypass '' -destkeystore identity.jks -srckeystore identity.p12 -srcstoretype PKCS12 -srcstorepass '' -alias alias
```

<br>
## Ciphers

To see a list of ciphers that a server supports, we can run the following
(noisy) nmap script:

```
nmap --script ssl-enum-ciphers -p 443 example.com
```

Example (truncated):

```
nmap --script ssl-enum-ciphers -p 443 example.com
Starting Nmap 7.60 ( https://nmap.org ) at 2021-01-20 14:42 AEDT
Nmap scan report for example.com (203.0.113.10)
Host is up (0.012s latency).
PORT    STATE SERVICE
443/tcp open  https
| ssl-enum-ciphers:
|   TLSv1.0:
|     ciphers:
|       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (secp256r1) - A
...
|       TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA (secp256r1) - C
|     compressors:
|       NULL
|     cipher preference: server
|   TLSv1.1:
|     ciphers:
|       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (secp256r1) - A
...
|       TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA (secp256r1) - C
|     compressors:
|       NULL
|     cipher preference: server
|   TLSv1.2:
|     ciphers:
|       TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 (secp256r1) - A
...
|       TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA (secp256r1) - C
|     compressors:
|       NULL
|     cipher preference: server
|_  least strength: C
Nmap done: 1 IP address (1 host up) scanned in 1.97 seconds
```

Note: the grade relates to the strength of the cipher, from A (strong) to F
(weak). From the [nmap script][ssl-enum-ciphers]: "The scoring is based on
the Qualys SSL Labs SSL Server Rating Guide, but does not take protocol
support (TLS version) into account, which makes up 30% of the SSL Labs
rating." The guide can be found [here][ssl-rating-guide].

<br>
## Extra reading

### Key usage and their mappings

When creating a new certificate (whether a CA, an intermediate, or an
endpoint), we can use the Key Usage (`keyUsage`) and Extended Key Usage
(`extendedKeyUsage`) fields. Good documentation exists in the green sections
[here][x509v3-config]. Object Identifiers (OIDs) can be found [here][oid-info].

#### Key Usage

| Human readable | OpenSSL key | Often used? |
|---|---|---|
| Digital Signature | digitalSignature | |
| | nonRepudiation | |
| | keyEncipherment | |
| | dataEncipherment | |
| | keyAgreement | |
| CRL Signing | cRLSign | |
| | encipherOnly | No |
| | decipherOnly | No |
| Certificate Signing | keyCertSign | |
| Off-line CRL Signing | keyCertSign + cRLSign | N/A |

"Off-line CRL Signing" is Microsoft's way of saying that we need both
`keyCertSign` and `cRLSign`.

#### Extended Key Usage

| Human readable | OpenSSL key | OID | Often used? |
|---|---|---|---|
| Server Authentication | serverAuth | 1.3.6.1.5.5.7.3.1 | Almost always |
| Client Authentication | clientAuth | 1.3.6.1.5.5.7.3.2 | Almost always |
| | codeSigning | | |
| | emailProtection | | No |
| | timeStamping | | |
| | OCSPSigning | | |
| | ipsecIKE | | No |
| | msCodeInd | | No |
| | msCodeCom | | No |
| | msCTLSign | | No |
| | msEFS | | No |

`serverAuth` is used for verifying the server's identity, and `clientAuth`
for verifying the client's identity. They are often combined, and
`serverAuth` is a requirement for external CAs.

### Telling the difference between DV, EV, and OV certificates

There are three types of certificates, each with increasing verification
requirements:

* **Domain Validation (DV)** — the most basic, common, and cheapest form of
  validation. A user just needs to verify domain ownership, normally by
  confirming a code via e-mail, DNS, or adding a file to the web server.
  Example e-mail addresses are: `admin`, `administrator`, `webmaster`,
  `hostmaster`, and `postmaster`, or a DNS TXT record.
* **Extended Validation (EV)** — a higher level of validation that normally
  requires a phone call to the company on a publicly listed directory
  (e.g. Dun and Bradstreet, Hoovers, Google, Yellow pages, Kompass).
* **Organisation Validation (OV)** — the certificate contains two OID values
  in the Policy field: the first is vendor specific, and the second is
  generic (based on the CA/Browser OID node).

The second (CA/Browser) OID field gives an idea of the certificate type:

* `2.23.140.1.2.1` = DV
* `2.23.140.1.2.2` = OV
* `2.23.140.1.1` = EV

The first, vendor-specific OID can then be used to verify that the
certificate came from the vendor it claims to be from (i.e. that it isn't
self-signed or forged).

### How a certificate chain is verified

An endpoint certificate is verified against its issuer using the signature
field (normally under the `sha256WithRSAEncryption` section). The public key
of the issuer (root or intermediate) is used to sign the public key of the
endpoint, and the result is added to the end of the certificate. The root
certificate signs itself (hence self-signed).

The `openssl verify` command (detailed above) is the easiest way of
validating the chain, but it can also be performed manually.

### Further reading

* [Building a private CA: Building root and intermediate CA][private-ca] —
  a walkthrough of setting up your own root and intermediate CA.

[ssllabs]: https://www.ssllabs.com/ssltest/
[ssl-enum-ciphers]: https://github.com/nmap/nmap/blob/master/scripts/ssl-enum-ciphers.nse
[ssl-rating-guide]: https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide
[x509v3-config]: https://www.openssl.org/docs/manmaster/man5/x509v3_config.html
[oid-info]: http://oid-info.com/get/1.3.6.1.5.5.7.3
[private-ca]: https://www.flexlabs.org/2019/07/private-ca-1-building-root-and-intermediate-ca
