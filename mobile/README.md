# Mobile App - React Native (Expo)

## Features

Teacher flow:
- Login
- View profile dashboard
- Scan QR/barcode using camera
- Manual scholar number entry fallback
- View daily attendance list
- Sort by time/scholar number
- Export PDF attendance report

Admin flow:
- Login
- Add teacher
- Remove teacher
- View teacher list
- Monitor attendance with filters (date, teacher, subject)

## Setup

1) Install dependencies:

```bash
npm install
```

2) Start from the repository root when possible:

```powershell
Set-Location "D:\Exam Attendance app"
.\start-app.ps1 -Mode Lan
```

Use USB mode when the phone is connected and USB debugging is enabled:

```powershell
Set-Location "D:\Exam Attendance app"
.\start-app.ps1 -Mode Usb
```

3) Start Metro manually only if needed:

```bash
npm run start
```

## Notes

- The app uses Expo SDK 56 and an Android development build, not Expo Go.
- Native folders are generated output; `android/` and `ios/` are ignored by Git.
- Rebuild the development client with `npx expo run:android` after native dependency or `app.json` changes.
- `src/api/client.ts` respects `EXPO_PUBLIC_API_BASE_URL`; the root startup scripts set it automatically for LAN or USB mode.
- The UI follows system light/dark mode through the shared Acropolis theme tokens and React Native Paper.
