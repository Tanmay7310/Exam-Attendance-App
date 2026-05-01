# Backend - Exam Attendance API

## Architecture

Clean layered architecture:

- Controller layer: request/response mapping
- Service layer: business rules (immutable attendance, duplicate blocking)
- Repository layer: persistence via Spring Data JPA

## Security Model

- JWT authentication
- Role-based route protection
  - `/api/teacher/**` -> TEACHER only
  - `/api/admin/**` -> ADMIN only
- No attendance update/delete endpoints to keep records immutable

## Endpoint Details

### Auth

1) `POST /api/auth/login`
- Purpose: Authenticate user and issue JWT
- Request:
```json
{
  "username": "teacher1",
  "password": "Teacher@123"
}
```
- Response:
```json
{
  "token": "<jwt>",
  "role": "TEACHER",
  "username": "teacher1",
  "teacherName": "Dr. A. Sharma",
  "subject": "Data Structures",
  "teacherCode": "TCH-101"
}
```

### Teacher

2) `GET /api/teacher/profile`
- Purpose: Fetch teacher profile

3) `POST /api/teacher/attendance/scan`
- Purpose: Mark attendance from scanned scholar number
- Duplicate behavior: returns duplicate=true and does not create another row

4) `GET /api/teacher/attendance/session?date=YYYY-MM-DD&sortBy=time|scholarNumber`
- Purpose: Show session attendance list

5) `GET /api/teacher/attendance/report/pdf?date=YYYY-MM-DD`
- Purpose: Download printable PDF report

6) `GET /api/teacher/students/search?scholarNumber=SCH001`
- Purpose: Search student by scholar number

### Admin

7) `POST /api/admin/teachers`
- Purpose: Add teacher account and profile

8) `GET /api/admin/teachers`
- Purpose: List all teachers

9) `DELETE /api/admin/teachers/{teacherId}`
- Purpose: Remove teacher

10) `GET /api/admin/attendance?date=YYYY-MM-DD&teacherId=1&subject=Data Structures`
- Purpose: View-only attendance monitoring with filters

## Swagger

- URL: `http://localhost:8080/swagger-ui/index.html`

## Run

```bash
mvn spring-boot:run
```
