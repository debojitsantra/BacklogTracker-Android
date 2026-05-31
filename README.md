#  Backlog Tracker Android
[![F-Droid](https://img.shields.io/f-droid/v/com.debojitsantra.backlogtracker.svg)](https://f-droid.org/packages/com.debojitsantra.backlogtracker/)


<p align="center">
  <img src="public/app_logo.png" width="120" style="border-radius: 24px;" alt="Backlog Tracker Logo" referrerPolicy="no-referrer" />
</p>

A beautifully crafted, high-fidelity **Material Design 3** mobile application powered by **React**, **Vite**, **Tailwind CSS v4**, and **Capacitor** to help students calculate, track, and systematically defeat compounding academic backlogs.

---

<!-- Uncomment after IzzyOnDroid listing is approved -->
<!-- <a href="https://apt.izzysoft.de/fdroid/index/apk/com.debojitsantra.backlogtracker"><img src="https://gitlab.com/IzzyOnDroid/repo/-/raw/master/assets/IzzyOnDroid.png" height="80" alt="Get it on IzzyOnDroid"></a> -->




---

##  Features

- **Smart Course Setup Wizard**: Painless onboarding configuration supporting standard preset curriculums and custom modular subjects.
- **Adaptive Threat Banner**: An algorithm-powered indicator tracking course convergence timeline (secured, stabilized, overloaded, or critical snowballing state).
- **Time Simulator / Predictor**: A predictive tool to fast-forward elapsed days and visualize the exact cumulative compound effects of neglecting daily targets.
- **Material You Dynamic Coloring**: Premium MD3 palette adapting meticulously across light themes and high-contrast ambient dark modes.
- **Robust Client Persistence**: Secure offline-first database mapping utilizing local browser and native state managers.

---

## Screenshots

<p align="center">
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/1.png" width="18%" alt="Screenshot 1" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/2.png" width="18%" alt="Screenshot 2" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/3.png" width="18%" alt="Screenshot 3" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/4.png" width="18%" alt="Screenshot 4" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/5.png" width="18%" alt="Screenshot 5" />
</p>

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Motion (Animations)
- **Native Shell**: `@capacitor/core`, `@capacitor/android` (for compiling high-performance Android APKs)
- **Build System**: Vite, ESLint
- **CI/CD Pipeline**: GitHub Actions for automated, cloud-based APK generation

---

## Install

Grab the latest release from 


<p>
  <a href="https://github.com/debojitsantra/BacklogTracker-Android/releases">
    <img src="https://img.shields.io/github/v/release/debojitsantra/BacklogTracker-Android?label=GitHub%20Release&style=for-the-badge&logo=github" alt="GitHub Release" style="vertical-align: middle;">
  </a>
  &nbsp;&nbsp;
  <a href="https://f-droid.org/packages/com.debojitsantra.backlogtracker">
    <img src="https://f-droid.org/badge/get-it-on.png" alt="Get it on F-Droid" height="60" style="vertical-align: middle;">
  </a>
</p>

---

##  Local Development & Web Execution

### Prerequisites
- **Node.js** `v22.0.0` or higher
- **NPM** (bundled with Node)

### Run the Web Server
```bash
npm install
npm run dev
```

---

##  Native Android Build

### Prerequisites
- **Android Studio** with Android SDK and build tools installed
- **Gradle** environment configured

### Build Steps
```bash
# 1. Build the web bundle
npm run build

# 2. Sync into Capacitor's Android project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

Press **Run** inside Android Studio to launch on your device or emulator.

---

##  Automated CI/CD (GitHub Actions)

Pushing a version tag (e.g. `v1.0`) triggers a fully automated signed release build.

The workflow (`.github/workflows/build.yml`) uses **Node.js 22** and **JDK 21** to build, sign, and publish the APK to GitHub Releases automatically.

---

##  Author

- Maintainer: **Debojit Santra**
- Documentation & some ui features made using Gemini
- GitHub Portfolio: [github.com/debojitsantra](https://github.com/debojitsantra)
