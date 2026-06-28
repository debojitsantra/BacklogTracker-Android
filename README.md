# Backlog Tracker

[![F-Droid](https://img.shields.io/f-droid/v/com.debojitsantra.backlogtracker.svg)](https://f-droid.org/packages/com.debojitsantra.backlogtracker/)
![Maintenance](https://img.shields.io/badge/maintained-yes)

<p align="center">
  <img src="public/app_logo.png" width="120" style="border-radius: 24px;" alt="Backlog Tracker Logo" referrerPolicy="no-referrer" />
</p>

Backlog Tracker is an offline-first app for Android and desktop. It tracks anything that piles up: study backlogs, work queues, games, habits, routines, or custom pending lists.

## Template Repo

Download tracker templates from:

[backlogdesigner.pages.dev](https://backlogdesigner.pages.dev) 

Source Repository: [Github](https://github.com/debojitsantra/BacklogTracker-Templates)


## Features

- Choose between count-based backlog mode and one-time task mode
- Add per-day or repeat-day automatic growth schedules
- Pause auto-growth when needed
- Estimate clearance time and finish date from your daily completion target
- Preview future backlog growth with the accumulation predictor
- Import and export JSON backups and shareable templates


## Screenshots
### Phone
<p align="center">
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/1.png" width="20%" alt="Screenshot P1" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/2.png" width="20%" alt="Screenshot P2" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/3.png" width="20%" alt="Screenshot P3" />
  <img src="fastlane/metadata/android/en-US/images/phoneScreenshots/4.png" width="20%" alt="Screenshot P4" />
</p>

### Desktop

<p align="center">
  <img src="assets/images/Screenshots/1.png" width="45%" alt="Screenshot D 1" />
  <img src="assets/images/Screenshots/2.png" width="45%" alt="Screenshot D 2" />
  <img src="assets/images/Screenshots/3.png" width="45%" alt="Screenshot D 3" />
  <img src="assets/images/Screenshots/4.png" width="45%" alt="Screenshot D 4" />
</p>

## Tech Stack

- React 
- TypeScript
- Vite
- Tailwind CSS v4
- Motion
- Capacitor for android
- Pake for desktop packaging

## Install

Download latest github release for your platform:

| Platform | Download |
|----------|----------|
| Windows  | [BacklogTracker-windows.zip](https://github.com/debojitsantra/BacklogTracker/releases/) |
| Linux    | [BacklogTracker-linux.zip](https://github.com/debojitsantra/BacklogTracker/releases/) |
| macOS    | [BacklogTracker-macos.zip](https://github.com/debojitsantra/BacklogTracker/releases/) *(untested)* |
| Android  | [BacklogTracker.apk](https://github.com/debojitsantra/BacklogTracker/releases/) |


## App Stores

### Android

<a href="https://f-droid.org/packages/com.debojitsantra.backlogtracker">
    <img src="https://f-droid.org/badge/get-it-on.png" alt="Get it on F-Droid" height="60" style="vertical-align: middle;">
</a>

### Windows

<a href="https://apps.microsoft.com/detail/9p112ngslvf0?referrer=appbadge&mode=full" target="_blank"  rel="noopener noreferrer">
	<img src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
</a>



## Local Development

### Prerequisites

- Node.js 22 or newer

### Run Web Dev Server

```bash
npm install
npm run dev
```

### Build Web Bundle

```bash
npm run build
```

## Android Build

### Prerequisites

- Android Studio
- Android SDK/build tools
- Java 21
- Node.js 22 or newer

### Build Steps

```bash
npm ci
npm run build
npx cap sync android
npx cap open android
```

Run from Android Studio, or use Gradle from the `android` directory.

## Desktop Builds


```text
.github/workflows/desktop.yml
```

It builds Linux, Windows, and macOS desktop packages from the local Vite output using `--use-local-file`.


## GitHub Actions

- `.github/workflows/build.yml` builds the signed Android release APK on version tags.
- `.github/workflows/desktop.yml` builds Linux, Windows, and macOS desktop artifacts with Pake.



## Important Declaration

Documentation and some UI features were made using Gemini. Everything is reviewed manually before committing.
