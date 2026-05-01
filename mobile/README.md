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

2) Update backend URL in:
- `src/api/client.ts`

3) Start Expo:

```bash
npm run start
```

## Notes

- For Android emulator, backend URL usually is `http://10.0.2.2:8080`
- For physical device, use your machine LAN IP
