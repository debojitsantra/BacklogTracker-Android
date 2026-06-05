#!/bin/bash
set -e

echo "==> Installing Java 21"
sudo apt-get update -q
sudo apt-get install -y openjdk-21-jdk
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
nvm install 22.0
nvm use 22.0
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

echo "==> Java version: $(java -version 2>&1 | head -1)"

echo "==> Downloading Android command-line tools"
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
unzip -q cmdline-tools.zip -d cmdline-tools-tmp
mkdir -p "$HOME/android-sdk/cmdline-tools"
mv cmdline-tools-tmp/cmdline-tools "$HOME/android-sdk/cmdline-tools/latest"
rm -rf cmdline-tools-tmp cmdline-tools.zip

export ANDROID_HOME=$HOME/android-sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "==> Accepting licenses and installing SDK"
yes | sdkmanager --licenses > /dev/null 2>&1
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

echo "==> Persisting env vars to ~/.bashrc"
grep -qxF 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' ~/.bashrc || \
  echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> ~/.bashrc

grep -qxF 'export ANDROID_HOME=$HOME/android-sdk' ~/.bashrc || \
  echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc

grep -qxF 'export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH' ~/.bashrc || \
  echo 'export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH' >> ~/.bashrc

cd /workspaces/BacklogTracker-Android

echo " Installing npm dependencies"
npm ci

echo "Building web assets"
npm run build

echo " Syncing Capacitor"
npx cap sync android

echo " Building debug APK"
cd android
./gradlew assembleDebug

echo ""
echo "Done."
python3 -m http.server
