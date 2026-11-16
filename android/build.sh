#!/bin/sh
# Build Journalista.apk from the web game in this repository.
#
# Needs Java and these Ubuntu/Debian packages:
#   sudo apt install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
#
# Usage, from the repository root:
#   KS_PASS=your-keystore-password ./android/build.sh path/to/journalista.keystore
#
# Every update must be signed with the same keystore, or phones will refuse to
# install it over the old version. Keep the keystore and its password safe and
# out of the repository.
set -e
KEYSTORE="$1"
SDK=/usr/lib/android-sdk/platforms/android-23/android.jar
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/android/build"
rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/obj" "$OUT/assets/www"

# The game's files go inside the APK, served from https://app.journalista/.
(cd "$ROOT" && git ls-files -co --exclude-standard | grep -vE '^(\.|README|android/)') | while read -r f; do
  mkdir -p "$OUT/assets/www/$(dirname "$f")"
  cp "$ROOT/$f" "$OUT/assets/www/$f"
done

cd "$ROOT/android"
aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$SDK"
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$SDK" -d "$OUT/obj" \
  src/com/journalista/app/MainActivity.java "$OUT/gen/com/journalista/app/R.java"
dalvik-exchange --dex --output="$OUT/classes.dex" "$OUT/obj"
aapt package -f -0 arsc -M AndroidManifest.xml -S res -A "$OUT/assets" -I "$SDK" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-pass pass:"$KS_PASS" --out "$ROOT/android/Journalista.apk" "$OUT/aligned.apk"
apksigner verify "$ROOT/android/Journalista.apk" && echo "Built android/Journalista.apk"
