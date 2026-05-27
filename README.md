#  Backlog Tracker Android
#### This app is ported to android using gemini from [github.com/debojitsantra/BacklogTracker](https://github.com/debojitsantra/BacklogTracker)

<p align="center">
  <img src="public/app_logo.png" width="120" style="border-radius: 24px;" alt="Backlog Tracker Logo" referrerPolicy="no-referrer" />
</p>

A beautifully crafted, high-fidelity **Material Design 3** mobile and web application powered by **React**, **Vite**, **Tailwind CSS v4**, and **Capacitor** to help students calculate, track, and systematically defeat compounding academic backlogs.

---

##  Features

- **Smart Course Setup Wizard**: Painless onboarding configuration supporting standard preset curriculums and custom modular subjects.
- **Adaptive Threat Banner**: An algorithm-powered indicator tracking course convergence timeline (secured, stabilized, overloaded, or critical snowballing state).
- **Time Simulator / Predictor**: A predictive tool to fast-forward elapsed days and visualize the exact cumulative compound effects of neglecting daily targets.
- **Material You Dynamic Coloring**: Premium MD3 palette adapting meticulously across light themes and high-contrast ambient dark modes.
- **Robust Client Persistence**: Secure offline-first database mapping utilizing local browser and native state managers.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Motion (Animations)
- **Native Shell**: `@capacitor/core`, `@capacitor/android` (for compiling high-performance Android APKs)
- **Build System**: Vite, ESLint
- **CI/CD Pipeline**: GitHub Actions for automated, cloud-based APK generation

---
## Install

- Grab letest release from [github.com/debojitsantra/Backlog-Tracker-Android/releases](https://github.com/debojitsantra/BacklogTracker-Android/releases)

##  Local Development & Web Execution

### 1. Prerequisites
- **Node.js**: `v22.0.0` or higher (Capacitor CLI v6 requirement)
- **NPM** (packaged with Node)

### 2. Run the Web Server
Install node packages and boot up the lightning-fast Vite developer server:
```bash
# Install node modules
npm install

# Start local server
npm run dev
```

---

##  Native Android Build

To compile and preview the code inside an Android Emulator or local physical device:

### Local Prerequisites
- **Android Studio** with Android SDK platform and build tools installed.
- **Gradle** environment configured.

### Local Compilation Steps
```bash
# 1. Compile the high-fidelity web bundle
npm run build

# 2. Sync web bundle elements into Capacitor's Android package structure
npx cap sync android

# 3. Open the workspace in Android Studio
npx cap open android
```
Inside Android Studio, press **Run** to launch the device wrapper in your target simulator!

---

##  Automated CI/CD Android Builds (GitHub Actions)

Any push or pull request to the `main` or `master` branches triggers a fully automated Android compilation sequence! 

The workflow (`.github/workflows/build.yml`) utilizes **Node.js 22**, **JDK 17**, and the updated **Capacitor CLI** to safely build and bundle artifact assets:


### Sideload Release Testing
1. Push your updates to your GitHub repository.
2. Navigate to the **Actions** tab of your GitHub repository.
3. Select the latest build workflow and download the compiled **APKs** from the artifacts panel!

---

##  Author

- Maintainer: **Debojit Santra**  
- Made Using Gemini
- GitHub Portfolio: [github.com/debojitsantra](https://github.com/debojitsantra)
