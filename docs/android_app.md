# Android app and PWA

## Today
The client is already an installable PWA: `public/manifest.webmanifest` (name MU Valhalla, standalone, landscape, icons 192/512/maskable)
and a service worker (`public/sw.js`, asset cache). Chrome on Android offers "Install app" only over HTTPS, so this starts working when
`docs/vm_runbook.md` step 3 is done. Options > Screen has an "Install the app" button already.

## iPhone
Safari: Share, then "Add to Home Screen". It runs standalone; no APK needed.

## APK
A Trusted Web Activity wraps the HTTPS site in a tiny app (Bubblewrap CLI: `npx @bubblewrap/cli init --manifest https://155-181-133-84.sslip.io/manifest.webmanifest`,
then `bubblewrap build`). It needs HTTPS, a JDK 17 and the Android SDK, and a digital asset links file at `/.well-known/assetlinks.json`
with the signing key fingerprint. None of that exists in this sandbox, so no APK was built. It is free (a self-signed key; Google Play
would cost a one-time fee, which is not needed to sideload).
