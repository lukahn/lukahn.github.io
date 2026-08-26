---
layout:     post
title:      Comparing Mac EDR solutions
date:       2024-03-24 00:00:00
author:     Luke Wakefield
summary:    How I compared SentinelOne and CrowdStrike on macOS, including the test methodology and the performance and malware detection results.
categories: security
thumbnail: magnifying-glass
tags:
 - sentinelone
 - crowdstrike
 - edr
 - macos
 - malware
 - antivirus
 - benchmark
 - kubernetes
---

This post documents how I compared two Endpoint Detection and Response
(EDR) products — **SentinelOne** and **CrowdStrike** — on macOS. I ran two
sets of tests: a performance test (compiling Kubernetes to stress the
engine), and a malware detection test (using the
[Objective-See][objective-see] Mac malware collection).

## Background

SentinelOne is an EDR platform that provides enhanced anti-virus and
anti-malware detection, as well as incident response to triage and remediate
infections. An agent runs in the background of your computer and checks
programs for malicious behaviour in real time.

Traditional anti-virus software uses signatures/hashes to detect known bad
files, which relies on regular full-disk scans and hoping the vendor has
already fingerprinted the malware before you encounter it. SentinelOne is
different: it looks at an application's behaviour, and if any known bad or
suspicious actions are taken (such as a request to encrypt the disk, as in
the case of ransomware), it can stop the application immediately and
quarantine it for analysis. This has the advantage of stopping brand-new
threats that have never been seen before.

## Why this matters

Ransomware is on the rise, and although Macs represent a much smaller target
compared to Windows, they can and do still get malware. The 2022 SonicWall
Cyber Threat Report collected data to show the trend:

![Global ransomware volume by year](/images/comparing-mac-edr-solutions/global_ransomware.png)

![Global intrusion attempts, 2013–2021](/images/comparing-mac-edr-solutions/global_intrusion_attempts.png)

<br>
## Performance test

### Method

For the tests, I chose a popular repository with a lot of files to stress
the antivirus (AV) engine. I came across [this post][mattfarina], which compares
software, and chose Kubernetes. (I initially chose compiling the Raspberry Pi
kernel, but this occurs in a container, which the EDR can't see.)

The running instructions (slightly outdated) for Mac are in
[this gist][atosatto].

1. Install Homebrew: <https://brew.sh/>
2. Update bash: `brew install bash`
3. Install dependencies: `brew install go gnu-tar`
4. Download a consistent Kubernetes source:
   <https://github.com/kubernetes/kubernetes/releases/tag/v1.24.3>
5. Extract the files: `tar -xzvf kubernetes-1.24.3.tar.gz`
6. Change directory: `cd kubernetes-1.24.3`
7. Set the environment variable: `KUBE_BUILD_PLATFORMS=linux/amd64`
8. Run the tests:

```
for i in {1..10}; do make clean; /usr/bin/time -a -o kubeperf-fresh.txt make all ; done
```

### Results

The compile was timed ten times on each setup: a fresh macOS install (no
EDR), with SentinelOne, and with CrowdStrike. Times are in seconds.

| Test # | Fresh macOS | SentinelOne | CrowdStrike |
|---|---|---|---|
| 1 | 152.12 | 157.06 | 196.99 |
| 2 | 150.31 | 157.43 | 200.11 |
| 3 | 150.41 | 158.16 | 197.54 |
| 4 | 150.11 | 158.72 | 197.98 |
| 5 | 150.51 | 159.85 | 202.30 |
| 6 | 150.92 | 158.43 | 197.76 |
| 7 | 149.84 | 157.93 | 199.59 |
| 8 | 151.02 | 160.17 | 197.59 |
| 9 | 150.11 | 158.64 | 198.13 |
| 10 | 150.47 | 159.95 | 196.59 |
| **Average** | **150.582** | **158.634** | **198.458** |

Compared to the baseline, SentinelOne added about 8 seconds (~5%), while
CrowdStrike added about 48 seconds (~32%).

![Compiling Kubernetes performance test — bar chart of average compile times](/images/comparing-mac-edr-solutions/kubernetes-performance-test.png)

<br>
## Malware detection test

I used the Mac malware collection from [Objective-See][objective-see]. The
high-level takeaway is that both products had very similar detection rates;
the main difference between them was performance (above).

The table below shows the per-sample results. Legend:

* **Yes** — detected
* **No** — missed
* **Partial** — partially detected (still installed)
* **N/A** — not applicable (couldn't be run/installed)
* **—** — not recorded

| Malware | Type | SentinelOne | CrowdStrike |
|---|---|---|---|
| AdWind | backdoor | Yes | Yes |
| AoboKeylogger (Baoba) | keylogger | N/A | N/A |
| AppleJeus | backdoor | Partial | Partial |
| BackTrack | keylogger | N/A | N/A |
| BadBunny | worm (poc) | N/A | N/A |
| BirdMiner (LoudMiner) | cryptominer | N/A | N/A |
| BlackHole (Musminim) | backdoor | N/A | N/A |
| Bundlore (Buca, CrossRider) | adware | Yes | Yes |
| Calisto | backdoor | Yes | Yes |
| CallMe | backdoor | N/A | N/A |
| Careto (Mask) | backdoor | Yes | Yes |
| CDDS (MacMa) | backdoor | Yes | Yes |
| ChatZum (Okaz, Zako) | adware | N/A | N/A |
| Clapzok | virus (poc) | Yes | Yes |
| ClickAgent | adware | N/A | N/A |
| CloudMensis | backdoor | N/A | N/A |
| CoinThief | bitcoin stealer | Yes | Yes |
| Coldroot | backdoor | N/A | N/A |
| Conduit (Trovi, VSearch) | adware | Yes | Yes |
| CookieMiner | cryptominer, backdoor | Partial | Partial |
| Cosmac (iAdware, Macrocosm) | adware (poc) | N/A | N/A |
| Cowhand | backdoor | N/A | N/A |
| CpuMeaner | cryptominer | N/A | N/A |
| CreativeUpdate | cryptominer | Partial | Partial |
| Crisis (Davinci, Morcut) | backdoor | N/A | N/A |
| CrossRAT | backdoor | Yes | Yes |
| Dacls | backdoor | Yes | Yes |
| DarthMiner | miner | N/A | N/A |
| DazzleSpy | backdoor | Yes | Yes |
| DevilRobber | spyware/miner | N/A | N/A |
| Dockster | backdoor | N/A | N/A |
| Dok | spyware (proxy) | Yes | Yes |
| DoubleFantasy | backdoor | N/A | N/A |
| Dummy | backdoor | N/A | N/A |
| Eleanor | backdoor | N/A | N/A |
| ElectroRAT | crypto stealer | N/A | N/A |
| ElectrumStealer | crypto stealer | Yes | Yes |
| Elite Keylogger | keylogger | Yes | Yes |
| EvilEgg | dropper | Yes | Yes |
| EvilOSX | backdoor | N/A | N/A |
| EvilQuest | backdoor | Yes | Yes |
| eWatch | spyware | — | — |
| FakeFileOpener | adware | N/A | N/A |
| FairyTale | adware | Yes | Yes |
| FileCoder | ransomware | Yes | Yes |
| FileCoder (FindZip, Patcher) | ransomware | Yes | Yes |
| FinSpy | backdoor | Yes | Yes |
| FkCodec (Codecm, Vinstaller) | adware | Yes | Yes |
| Flasfa (FlsplyDp) | backdoor | N/A | N/A |
| FlashBack | backdoor | Yes | Yes |
| FruitFly (Quimitchin) | backdoor | No | No |
| Genieo (InstallMac) | adware | Yes | Yes |
| GetShell | backdoor | N/A | N/A |
| Gimmick | backdoor | Yes | Yes |
| GinX | ransomware | — | — |
| GMERA | backdoor | Yes | Yes |
| Gopher | ransomware (poc) | Yes | Yes |
| GoPhoto | adware/pup | Yes | Yes |
| GravityRAT | backdoor | N/A | N/A |
| GreenLambert | backdoor | N/A | N/A |
| HellRaiser (Brutal, HellRTS, PinHead) | backdoor | N/A | N/A |
| HiddenLotus | backdoor | Yes | Yes |
| Hovdy (AsTHT) | backdoor | N/A | N/A |
| Hydromac | adware | N/A | N/A |
| IceFog (PrxlA) | backdoor | N/A | N/A |
| Inqtana (Niqtana) | worm (poc) | N/A | N/A |
| InstallCap | adware | Yes | Yes |
| InstallCore (FlashImitator, IronCore) | adware | Yes | Yes |
| IPStorm | botnet | N/A | N/A |
| iWorkServ (iServices, Krowi) | backdoor | N/A | N/A |
| iWorm | backdoor | N/A | N/A |
| Jacksbot (jRAT) | backdoor | N/A | N/A |
| Janicab | backdoor | Yes | Yes |
| KeRanger | ransomware | Yes | Yes |
| Keyboard Spy Logger | keylogger | — | — |
| Keydnap | backdoor | Yes | Yes |
| KeyboardLoggerX | keylogger | — | — |
| KitM (FileSteal, HackBack, Kitmos) | backdoor | Yes | Yes |
| Komplex | backdoor | Yes | Yes |
| KoobFace (Boonana) | worm | N/A | N/A |
| Lamadai (Olyx, PubSab, SabPub) | backdoor | N/A | N/A |
| LamePyre | backdoor | No | No |
| Lamzev (Malez) | backdoor | N/A | N/A |
| LaoShu | backdoor | Yes | Yes |
| Leverage (FlashyComposer) | backdoor | N/A | N/A |
| LoseLose | file destroyer (poc) | N/A | N/A |
| Mabouia | ransomware (poc) | No | No |
| Macarena | virus (poc) | N/A | N/A |
| MacDefender (MacProtector, MacSecurity) | adware | Yes | Yes |
| MacDownloader | backdoor | Yes | Yes |
| MacInstaller | adware | Yes | Yes |
| MacKontrol (MacControl, Tibet) | backdoor | N/A | N/A |
| MacRansom | ransomware | N/A | N/A |
| MacKeeper | adware/pup | Yes | Yes |
| MacSpy | backdoor | Yes | Yes |
| MacSweeper | adware | N/A | N/A |
| MacVX | adware | Yes | Yes |
| MaMi | adware | N/A | N/A |
| MineSteal | password stealer | N/A | N/A |
| Mokes | backdoor | Yes | Yes |
| Mughthesec (Safe Finder, Operator Mac) | adware | Yes | Yes |
| NukeSped | backdoor | Partial | Partial |
| OceanLotus | backdoor | Yes | Yes |
| OOMP (Leap) | worm | N/A | N/A |
| OpinionSpy (Premier Opinion) | adware/backdoor | N/A | N/A |
| OSAMiner | cryptominer | N/A | N/A |
| PerfectKeylog (Blazing Keylogger) | keylogger | N/A | N/A |
| PintSized | backdoor | Yes | Yes |
| PokerStealer (CorPref) | backdoor | N/A | N/A |
| PPMiner | | N/A | N/A |
| PSides | | N/A | N/A |
| Proton (ParticleSmasher) | backdoor | Yes | Yes |
| Puper (DNSChanger, Jahlav, RSPlug-F) | adware | Yes | Yes |
| Pwnet | miner | Yes | Yes |
| Qhost (HostMod) | adware | No | No |
| RealTimeSpy | backdoor | Yes | Yes |
| Revir (Imuller) | backdoor | Yes | Yes |
| Renepo (Opener) | worm | N/A | N/A |
| Rubyilyn | rootkit (poc) | Yes | Yes |
| Shlayer | adware | Yes | Yes |
| Siggen | backdoor | N/A | N/A |
| SilverSparrow | adware | N/A | N/A |
| SMSSend | adware | Yes | Yes |
| Snake | backdoor | Yes | Yes |
| SniperSpy | backdoor | N/A | N/A |
| Spigot | adware | N/A | N/A |
| SysJoker | backdoor | N/A | N/A |
| Systemd (Demsty) | backdoor | Yes | Yes |
| TinyShell | backdoor | N/A | N/A |
| Tored | bot (poc) | N/A | N/A |
| Tsunami (Kaiten) | IRC bot | Yes | Yes |
| Ventir | backdoor | Yes | Yes |
| VSearch (Pirrit) | adware | Yes | Yes |
| WatchCat | backdoor | N/A | N/A |
| WeaponX | rootkit (poc) | N/A | N/A |
| WildPressure | backdoor | N/A | N/A |
| WindTail | backdoor | Yes | Yes |
| WireLurker (Machook) | backdoor | Yes | Yes |
| Wirenet (NetWeirdRC) | backdoor | N/A | N/A |
| XAgent | backdoor | N/A | N/A |
| Xamloader (WeDownload) | adware | N/A | N/A |
| XcodeGhost | virus | — | — |
| XcodeSpy | backdoor | N/A | N/A |
| XCSSET | virus | N/A | N/A |
| XLoader | backdoor | Partial | Partial |
| XslCmd | backdoor | Yes | Yes |
| Yontoo | adware | Yes | Yes |
| Yort | backdoor | N/A | N/A |
| ZuRu | backdoor | Yes | Yes |

[mattfarina]: https://gist.github.com/mattfarina/7627cb5ebb8fc01bfd62f4a6942fce04
[atosatto]: https://gist.github.com/atosatto/bad0bf15949b2b3bd3cb
[objective-see]: https://objective-see.org/malware.html
