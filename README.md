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
- Attendance records immutable (no update/delete attendance APIs)

## Database Design

Tables:
- `users` (credentials + role)
- `teachers` (teacher profile linked to user)
- `students`
- `attendance_sessions` (teacher + date)
- `attendance_records` (session + student + scanned timestamp)

Key constraints:
- `uk_session_teacher_date` prevents multiple sessions for same teacher/date
- `uk_session_student` prevents duplicate student attendance in same session

## API Endpoints

Authentication:
- `POST /api/auth/login`

Teacher module:
- `GET /api/teacher/profile`
- `POST /api/teacher/attendance/scan`
- `GET /api/teacher/attendance/session?date=YYYY-MM-DD&sortBy=time|scholarNumber`
- `GET /api/teacher/attendance/report/pdf?date=YYYY-MM-DD`
- `GET /api/teacher/students/search?scholarNumber=SCH001`

Admin module:
- `POST /api/admin/teachers`
- `GET /api/admin/teachers`
- `DELETE /api/admin/teachers/{teacherId}`
- `GET /api/admin/attendance?date=YYYY-MM-DD&teacherId=1&subject=Data Structures`

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

### 1.1) Start Mobile With Stable LAN Host (Recommended)

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-mobile-lan.ps1
```

This command:
- detects your active LAN IPv4 address
- pins Expo host to that IP
- sets `EXPO_PUBLIC_API_BASE_URL` to `http://<lan-ip>:8080`
- starts Expo on port `8081`

Optional custom Expo port:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-mobile-lan.ps1 -Port 8082
```

### 1.2) Start Backend + Mobile Together

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-app.ps1
```

This opens two terminals and starts:
- backend (MySQL + Spring Boot)
- mobile (Expo LAN with pinned host)

### 2) Configure Mobile Base URL

`mobile/src/api/client.ts` now auto-resolves API host from Expo runtime host.

If you need to force a specific URL, set:
- `EXPO_PUBLIC_API_BASE_URL=http://<your-machine-lan-ip>:8080`

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

- Spring Boot context test included in `backend/src/test`
- You can run backend tests with:

```bash
cd backend
mvn test
```

## Recommended Extensions

- Offline mode queue + background sync in mobile app
- Analytics dashboard endpoints for attendance trends
