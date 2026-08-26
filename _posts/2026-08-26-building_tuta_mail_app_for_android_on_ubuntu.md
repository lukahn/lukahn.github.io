---
layout:     post
title:      Building Tuta mail app for Android on Ubuntu
date:       2026-08-26 00:00:00
author:     Luke Wakefield
summary:    A step-by-step guide to building the Tuta Mail Android app on Ubuntu, including the packages, path variables and NDK setup missing from the official docs.
categories: android
thumbnail: box-archive
tags:
 - tuta
 - tutanota
 - android
 - ubuntu
 - linux
 - build
 - ndk
 - emscripten
 - nodejs
 - rust
---

These are the steps I followed to build my own copy of the
[Tuta Mail][tuta] Android app on Ubuntu. I'd initially done this to try to fix the app going offline after 10–15 minutes, but I wasn't successful. I'm leaving this here in case anyone else runs into problems building. I gave up trying to do it on Windows in the end, as I couldn't update Node.js or another build tool (make.exe?) to the required version.

The official build instructions live in the
repository's [**BUILDING.md**][building] file, but they skip a few system
packages and all of the environment/path variables the build actually needs.
This post fills in the gaps, based on the troubleshooting I did to get a
successful build.

Note: a self-built app does **not** update itself. If you want automatic
updates, use the app from the [Google Play Store][play] or [F-Droid][fdroid],
or the APK published on the [GitHub releases][releases] page.

<br>
## Prerequisites

The official docs only list Git, Node.js and the Android SDK (Software Development Kit). The build also
needs the standard build toolchain, Java 17, Rust and Emscripten.

### System packages

```bash
sudo apt update
sudo apt install build-essential git
```

* `build-essential` — the compiler/make toolchain used to build the native
  (WebAssembly (WASM) and C) dependencies.
* `git` — to clone the repository and its submodules.

### Node.js

Install the current Node.js from the NodeSource repository (the version
required is noted in the repo's `package.json` `engines` field):

```bash
sudo apt install ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=24
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install nodejs
sudo npm install -g npm@latest
```

### Java 17

The Android Gradle build needs a JDK (Java Development Kit); 17 is known to work:

```bash
sudo apt install -y openjdk-17-jdk
java -version
javac -version
```

### Rust

Rust (1.80 or newer) is used for the WASM crypto code:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
cargo --version
```

### Emscripten

Emscripten compiles the C/C++ crypto libraries to WebAssembly:

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
emcc --version
echo 'source "$HOME/emsdk/emsdk_env.sh"' >> ~/.bashrc
cd ..
```

<br>
## Android SDK and NDK

Install the Android command line tools, then use `sdkmanager` to pull in the
platform tools and the NDK (Native Development Kit).

```bash
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-15859902_latest.zip
unzip commandlinetools-linux-15859902_latest.zip
mv cmdline-tools latest
cd ~
```

The zip build number changes over time; if the above URL is stale, grab the
current Linux command line tools from the [Android developer downloads][cmdline]
page.

Accept the licences and install the platform tools:

```bash
yes | sdkmanager --licenses
sdkmanager "platform-tools"
```

### NDK version

The exact NDK version the app needs is printed in the build output, so the
easiest approach is to run the build once and read the version it complains
about, then install that one:

```bash
sdkmanager "ndk;27.3.13750724"
```

If you'd rather look it up yourself, the NDK versions are listed on the
[NDK downloads][ndk-lts] page (under the LTS releases).

<br>
## Path variables

These are the variables that aren't mentioned in the official docs. Add them
to `~/.bashrc` so they survive a reboot:

```bash
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$HOME/android-sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Then reload your shell:

```bash
source ~/.bashrc
which sdkmanager
which adb
```

If the Gradle build still can't find the SDK, also add the variables system
wide:

```bash
echo 'ANDROID_HOME="/home/luke/android-sdk"' | sudo tee -a /etc/environment
echo 'ANDROID_SDK_ROOT="/home/luke/android-sdk"' | sudo tee -a /etc/environment
source /etc/environment
```

The app's Gradle build also expects a `local.properties` file pointing at the
SDK. Create it inside the repo once it's cloned:

```bash
echo "sdk.dir=$HOME/android-sdk" > /path/to/tutanota/app-android/local.properties
```

<br>
## Building the app

Clone the repository and check out the latest Android release tag (replace
`xxx` with the current tag, e.g. `tutanota-android-release-123.456.789`):

```bash
git clone https://github.com/tutao/tutanota.git
cd tutanota
git checkout tutanota-android-release-xxx
```

Initialise and fetch the submodules:

```bash
git submodule init
git submodule sync --recursive
git submodule update
```

Install the dependencies:

```bash
npm ci
```

### Keystore

The signing keystore **must be placed in the app directory**
(`app-android/app/`) for the build to find it. If you don't have one yet,
create it:

```bash
keytool -genkey -noprompt -keystore MyKeystore.jks -alias tutaKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=com.example"
```

Then copy the keystore into the app directory:

```bash
cp MyKeystore.jks app-android/app/
```

### Run the build

```bash
APK_SIGN_ALIAS="tutaKey" APK_SIGN_STORE='MyKeystore.jks' APK_SIGN_STORE_PASS="CHANGEME" APK_SIGN_KEY_PASS="CHANGEME" node android
```

The build prints the path of the produced APK (Android Package) when it finishes.

**Note:** run the *whole* command above, including the `APK_SIGN_*`
variables — running just `node android` won't pick up the keystore (`.jks`).

<br>
## Installing on a device

With your phone connected (or an emulator running), install the APK:

```bash
adb install -r <path-to-apk>
```

<br>
## Troubleshooting notes

* **Don't build in a shared folder** — if the repo is on a VirtualBox shared
  folder (e.g. `/media/sf_shared/`), you'll run into permission issues and
  Git's "dubious ownership" error. Clone the repo into your home directory
  (e.g. `~/tutanota`) instead of the shared folder:

  ```bash
  git clone https://github.com/tutao/tutanota.git ~/tutanota
  ```

* **Disk space** — the build uses a lot of space. After a full build, the
  whole `tutanota` folder came in at about **6.8 GB**, so make sure you have
  enough free disk space before you start.

* **NDK not found** — install the exact version the build reports via
  `sdkmanager "ndk;<version>"`. See the [NDK downloads][ndk-lts] page if you
  want to check versions without re-running the build.

* **Signing key not found** — make sure the `.jks` keystore is inside
  `app-android/app/`, since `APK_SIGN_STORE` is given as a relative filename.

* **Capturing the log** — the build produces a lot of output. Pipe it to a
  file so you can scroll back through it:

  ```bash
  APK_SIGN_ALIAS="tutaKey" APK_SIGN_STORE='MyKeystore.jks' APK_SIGN_STORE_PASS="CHANGEME" APK_SIGN_KEY_PASS="CHANGEME" node android 2>&1 | tee -a build.log
  ```

[tuta]: https://tuta.com
[building]: https://github.com/tutao/tutanota/blob/master/doc/BUILDING.md
[play]: https://play.google.com/store/apps/details?id=de.tutao.tutanota
[fdroid]: https://f-droid.org/en/packages/de.tutao.tutanota/
[releases]: https://github.com/tutao/tutanota/releases
[cmdline]: https://developer.android.com/studio#command-line-tools-only
[ndk-lts]: https://developer.android.com/ndk/downloads/#lts-downloads
