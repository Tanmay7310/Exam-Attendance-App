# Exam Attendance Management App

A complete mobile + backend solution for college exam attendance using barcode/QR scanning.

## Technology Stack

- Mobile App: React Native (Expo + TypeScript)
- Backend API: Java 21, Spring Boot 3, Spring Security, JPA/Hibernate
- Database: MySQL 8
- Authentication: JWT
- PDF Generation: OpenPDF (iText-style API)
- API Docs: Swagger/OpenAPI

## Project Structure

- `backend/`: Spring Boot API (Controller -> Service -> Repository)
- `mobile/`: React Native app for Teacher and Admin roles
- `database/`: SQL schema and sample data scripts

## Core Requirements Implemented

- Secure login for Teacher/Admin via JWT
- Role-based access control
- Teacher profile (name, subject, ID)
- Barcode/QR attendance scan flow
- Attendance entry stores scholar number, student name, date/time
- Duplicate scan prevention (same student cannot be scanned twice in same session/day)
- Attendance list with sorting (time or scholar number)
- PDF report export for teacher session
- Admin teacher management (add/remove/view)
- Admin attendance monitoring with filters (date, teacher, subject)
- Admin student management, subject catalogue, bulk imports, and student promotions
- Attendance session details with present/absent roster resolution when class snapshot data exists
- Manual attendance corrections stored as audit entries, with corrected counts shown in detail and list views
- Attendance records immutable (no update/delete attendance APIs)

## Database Design

Tables:
- `users` (credentials + role)
- `teachers` (teacher profile linked to user)
- `students`
- `subjects`
- `attendance_sessions` (teacher + date + subject + class snapshot)
- `attendance_records` (session + student + scanned timestamp)
- `attendance_session_roster_snapshots` (immutable per-session class roster used for absent students and historical accuracy)
- `attendance_adjustments` (manual present/absent corrections with audit data)
- `student_promotion_batches`
- `student_promotion_items`

Key constraints:
- `uk_session_teacher_date_subject_class` prevents duplicate sessions for the same teacher/date/subject/class context
- `uk_session_student` prevents duplicate student attendance in same session
- `uk_subject_name_branch_semester` prevents duplicate subject names for the same branch and semester

## API Endpoints

Authentication:
- `POST /api/auth/login`

Teacher module:
- `GET /api/teacher/profile`
- `POST /api/teacher/attendance/scan`
- `GET /api/teacher/attendance/session?date=YYYY-MM-DD&sortBy=time|scholarNumber`
- `GET /api/teacher/attendance/history`
- `GET /api/teacher/attendance/sessions`
- `GET /api/teacher/attendance/sessions/{sessionId}`
- `POST /api/teacher/attendance/sessions/{sessionId}/adjust`
- `GET /api/teacher/attendance/report/pdf?date=YYYY-MM-DD&subject=...&examYear=...&examSemester=...&examBranch=...&examSection=...`
- `GET /api/teacher/students/search?scholarNumber=SCH001`
- `GET /api/teacher/subjects`

Admin module:
- `POST /api/admin/teachers`
- `GET /api/admin/teachers`
- `POST /api/admin/teachers/import`
- `DELETE /api/admin/teachers/{teacherId}`
- `POST /api/admin/students`
- `GET /api/admin/students`
- `POST /api/admin/students/import`
- `DELETE /api/admin/students/{studentId}`
- `POST /api/admin/students/promotions/preview`
- `POST /api/admin/students/promotions/execute`
- `GET /api/admin/students/promotions`
- `GET /api/admin/students/promotions/{batchId}`
- `POST /api/admin/students/promotions/{batchId}/rollback`
- `POST /api/admin/subjects`
- `GET /api/admin/subjects`
- `POST /api/admin/subjects/import`
- `PUT /api/admin/subjects/{subjectId}`
- `DELETE /api/admin/subjects/{subjectId}`
- `GET /api/admin/attendance?date=YYYY-MM-DD&teacherId=1&subject=Data Structures`
- `GET /api/admin/attendance/sessions?date=YYYY-MM-DD&teacherId=1&subject=Data Structures`
- `GET /api/admin/attendance/sessions/{sessionId}`
- `POST /api/admin/attendance/sessions/{sessionId}/adjust`
- `GET /api/admin/attendance/report/pdf?date=YYYY-MM-DD&teacherId=...&subject=...`

Swagger:
- `http://localhost:8080/swagger-ui/index.html`

## Setup and Run

### Prerequisites

- JDK 21
- Docker Desktop (running)
- Node.js 20+
- Expo CLI (optional global install)

### 1) Start MySQL + Backend (One Command)

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend-mysql.ps1
```

This command:
- starts Docker MySQL (`exam-attendance-mysql`)
- waits for DB health
- runs Spring Boot with `dev` profile (MySQL only, no H2 override)

Optional custom port:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend-mysql.ps1 -Port 8082
```

### 1.1) Start Mobile With Stable LAN Host

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-mobile-lan.ps1 -Mode Lan
```

This command:
- detects your active LAN IPv4 address
- pins Expo host to that IP
- sets `EXPO_PUBLIC_API_BASE_URL` to `http://<lan-ip>:8080`
- starts Expo development build mode on port `8081`

Optional custom Expo and backend ports:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-mobile-lan.ps1 -Mode Lan -Port 8082 -BackendPort 8083
```

### 1.2) Start Mobile With USB/Wired Development Build

Use this when the phone is connected by USB and USB debugging is enabled:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-mobile-lan.ps1 -Mode Usb
```

This command:
- verifies an authorized Android device is available through `adb`
- configures `adb reverse` for Expo and backend ports
- sets `EXPO_PUBLIC_API_BASE_URL` to `http://localhost:8080`
- starts Expo development build mode on port `8081`
- optionally launches the installed Android app when `-LaunchAndroid $true` is used

Optional custom Expo and backend ports:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-mobile-lan.ps1 -Mode Usb -Port 8081 -BackendPort 8082 -LaunchAndroid $true
```

### 1.3) Start Backend + Mobile Together

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -Mode Lan
```

This opens two terminals and starts:
- backend (MySQL + Spring Boot)
- mobile (Expo development build with the selected network mode)

Wired/USB mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -Mode Usb
```

Optional custom ports:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -Mode Usb -BackendPort 8082 -ExpoPort 8081
powershell -ExecutionPolicy Bypass -File .\start-app.ps1 -Mode Lan -BackendPort 8082 -ExpoPort 8081
```

### 2) Configure Mobile Base URL

`mobile/src/api/client.ts` now auto-resolves API host from Expo runtime host.

If you need to force a specific URL, set:
- `EXPO_PUBLIC_API_BASE_URL=http://<your-machine-lan-ip>:8080`

When the backend runs on a custom port, use the same port in `EXPO_PUBLIC_API_BASE_URL` or start through `start-app.ps1` so it is passed automatically.

### Database Migration Note

Fresh databases can use `database/schema.sql`. Existing databases should apply the idempotent SQL in `database/migrations/20260601_attendance_roster_snapshots.sql`, or restart the backend with the current JPA `ddl-auto=update` configuration so Hibernate can create the roster snapshot table.

### Native Android / Development Build Note

The project includes a native Android folder (`mobile/android`), so treat it as a development-build project when building APKs. If you change native-facing values in `mobile/app.json` such as permissions, package name, splash, plugins, or orientation, sync those changes into the native project with the appropriate Expo prebuild/development-build workflow before shipping a native build.

`npx expo-doctor` may warn that config fields are not automatically synced because this is no longer an Expo-Go-only/CNG project. For presentation builds, verify the native Android files directly after config changes and rebuild the development APK with:

```powershell
Set-Location "D:\Exam Attendance app\mobile"
npx expo run:android
```

### Theme Note

The current Acropolis UI is intentionally fixed to the light institutional theme for consistent projector and mobile presentation output. Do not claim automatic dark-mode support unless the hardcoded Acropolis color tokens and Paper theme are converted to a real system-aware theme.

### 3) Start Mobile (Manual)

```bash
cd mobile
npm install
npm run start
```

## Default Credentials

- Admin: `admin1` / `Admin@123`
- Teacher: `teacher1` / `Teacher@123`

## Security Notes

- JWT required for all protected routes
- Role checks at route level (`/api/admin/**`, `/api/teacher/**`)
- Attendance is append-only in API design
- Duplicate scans blocked by service logic + DB unique constraint

## Testing

- Spring Boot context and attendance-correction tests are included in `backend/src/test`
- You can run backend tests with:

```bash
cd backend
mvn test
```

- Mobile TypeScript check:

```bash
cd mobile
npx tsc --noEmit
```

## Recommended Extensions

- Offline mode queue + background sync in mobile app
- Analytics dashboard endpoints for attendance trends
