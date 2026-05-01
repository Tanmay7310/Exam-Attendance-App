package com.exam.attendance.service;

import com.exam.attendance.dto.teacher.AttendanceRecordResponse;
import com.exam.attendance.dto.teacher.ScanAttendanceResponse;
import com.exam.attendance.dto.teacher.TeacherProfileResponse;
import com.exam.attendance.entity.*;
import com.exam.attendance.exception.ApiException;
import com.exam.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final PdfService pdfService;

    public TeacherProfileResponse getProfile(String username) {
        Teacher teacher = getTeacherByUsername(username);
        return TeacherProfileResponse.builder()
                .teacherCode(teacher.getTeacherCode())
                .name(teacher.getName())
                .subject(teacher.getSubject())
                .build();
    }

    @Transactional
    public ScanAttendanceResponse scan(String username, String scholarNumber, String examSubject, boolean caseSensitive) {
        try {
            Teacher teacher = getTeacherByUsername(username);
            String normalizedScholarNumber = scholarNumber.trim();
            LocalDate today = LocalDate.now();
            AttendanceSession session = findOrCreateSession(teacher, today, examSubject);

            Student student = (caseSensitive
                    ? studentRepository.findByScholarNumberCaseSensitive(normalizedScholarNumber)
                    : studentRepository.findByScholarNumber(normalizedScholarNumber))
                    .orElseThrow(() -> new ApiException("Student not found for scholar number: " + normalizedScholarNumber));

            if (attendanceRecordRepository.existsBySessionAndStudent(session, student)) {
                return ScanAttendanceResponse.builder()
                        .scholarNumber(student.getScholarNumber())
                        .studentName(student.getName())
                        .scannedAt(Instant.now())
                        .duplicate(true)
                        .message("Duplicate scan blocked for current session")
                        .build();
            }

            AttendanceRecord record = AttendanceRecord.builder()
                    .session(session)
                    .student(student)
                    .scannedAt(Instant.now())
                    .build();
            try {
                attendanceRecordRepository.save(record);
            } catch (DataIntegrityViolationException ex) {
                return ScanAttendanceResponse.builder()
                        .scholarNumber(student.getScholarNumber())
                        .studentName(student.getName())
                        .scannedAt(Instant.now())
                        .duplicate(true)
                        .message("Duplicate scan blocked for current session")
                        .build();
            }

            return ScanAttendanceResponse.builder()
                    .scholarNumber(student.getScholarNumber())
                    .studentName(student.getName())
                    .scannedAt(record.getScannedAt())
                    .duplicate(false)
                    .message("Attendance marked successfully")
                    .build();
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException("Scan failed due to server validation. Please retry.");
        }
    }

    public List<AttendanceRecordResponse> getSessionAttendance(String username, LocalDate date, String sortBy) {
        Teacher teacher = getTeacherByUsername(username);
        AttendanceSession session = attendanceSessionRepository.findFirstByTeacherAndSessionDateOrderByCreatedAtAsc(teacher, date)
                .orElse(null);

        if (session == null) {
            return List.of();
        }

        List<AttendanceRecord> records = attendanceRecordRepository.findBySessionOrderByScannedAtAsc(session);
        if ("scholarNumber".equalsIgnoreCase(sortBy)) {
            records = records.stream()
                    .sorted(Comparator.comparing(r -> r.getStudent().getScholarNumber()))
                    .toList();
        }

        return records.stream()
                .map(this::toAttendanceRecordResponse)
                .toList();
    }

    public List<AttendanceRecordResponse> getAttendanceHistory(String username) {
        Teacher teacher = getTeacherByUsername(username);

        return attendanceRecordRepository.findBySession_Teacher_Id(teacher.getId()).stream()
                .sorted(
                        Comparator.comparing((AttendanceRecord r) -> r.getSession().getSessionDate()).reversed()
                                .thenComparing(AttendanceRecord::getScannedAt)
                )
                .map(this::toAttendanceRecordResponse)
                .toList();
    }

    public byte[] generatePdfReport(String username, LocalDate date, String subject) {
        Teacher teacher = getTeacherByUsername(username);
        AttendanceSession session = resolveSessionForReport(teacher, date, subject);
        if (session == null) {
            String fallbackSubject = StringUtils.hasText(subject) ? subject.trim() : teacher.getSubject();
            return pdfService.generateAttendancePdf(teacher, date, fallbackSubject, List.of());
        }

        List<AttendanceRecord> records = attendanceRecordRepository.findBySessionOrderByScannedAtAsc(session);
        List<AttendanceRecordResponse> responses = records.stream()
                .map(this::toAttendanceRecordResponse)
                .toList();
        String reportSubject = resolveSessionSubject(session);
        return pdfService.generateAttendancePdf(teacher, date, reportSubject, responses);
    }

    private AttendanceSession resolveSessionForReport(Teacher teacher, LocalDate date, String subject) {
        String normalizedSubject = normalizeSubject(subject);
        if (!StringUtils.hasText(normalizedSubject)) {
            return attendanceSessionRepository.findFirstByTeacherAndSessionDateOrderByCreatedAtAsc(teacher, date)
                    .orElse(null);
        }

        return attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubject(teacher, date, normalizedSubject)
                .orElse(null);
    }

    public AttendanceRecordResponse searchStudent(String scholarNumber) {
        Student student = studentRepository.findByScholarNumber(scholarNumber)
                .orElseThrow(() -> new ApiException("Student not found"));
        return AttendanceRecordResponse.builder()
                .scholarNumber(student.getScholarNumber())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(student.getName())
                .scannedAt(null)
                .build();
    }

    private Teacher getTeacherByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found"));
        return teacherRepository.findByUser(user)
                .orElseGet(() -> createAdminTeacherProfileIfNeeded(user));
    }

    private Teacher createAdminTeacherProfileIfNeeded(User user) {
        if (user.getRole() != Role.ADMIN) {
            throw new ApiException("Teacher profile not found");
        }

        Teacher teacher = Teacher.builder()
            .teacherCode("ADMIN-" + user.getId())
            .name(user.getUsername())
            .subject("N/A")
            .user(user)
            .build();

        try {
            return teacherRepository.save(teacher);
        } catch (DataIntegrityViolationException ex) {
            return teacherRepository.findByUser(user)
                .orElseThrow(() -> new ApiException("Unable to create admin attendance profile"));
        }
    }

    private AttendanceSession findOrCreateSession(Teacher teacher, LocalDate date, String examSubject) {
        String normalizedSubject = normalizeSubject(examSubject);
        AttendanceSession existing = normalizedSubject == null
                ? attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubjectIsNull(teacher, date).orElse(null)
                : attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubject(teacher, date, normalizedSubject).orElse(null);
        if (existing != null) {
            return existing;
        }

        AttendanceSession newSession = AttendanceSession.builder()
            .teacher(teacher)
            .sessionDate(date)
            .examSubject(normalizedSubject)
            .createdAt(Instant.now())
            .build();

        try {
            return attendanceSessionRepository.save(newSession);
        } catch (DataIntegrityViolationException ex) {
            if (isLegacySessionConstraintConflict(ex)) {
                throw new ApiException("Subject-wise scanning requires DB migration for attendance sessions. Please contact admin.");
            }

            return normalizedSubject == null
                    ? attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubjectIsNull(teacher, date)
                            .orElseThrow(() -> new ApiException("Unable to create attendance session"))
                    : attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubject(teacher, date, normalizedSubject)
                            .orElseThrow(() -> new ApiException("Unable to create attendance session"));
        }
    }

    private boolean isLegacySessionConstraintConflict(DataIntegrityViolationException ex) {
        String message = ex.getMessage();
        if (message == null) {
            return false;
        }
        String normalized = message.toLowerCase();
        return normalized.contains("uk_session_teacher_date")
                || normalized.contains("teacher_id")
                && normalized.contains("session_date")
                && normalized.contains("duplicate");
    }

    private String normalizeSubject(String subject) {
        return StringUtils.hasText(subject) ? subject.trim() : null;
    }

    private AttendanceRecordResponse toAttendanceRecordResponse(AttendanceRecord record) {
        AttendanceSession session = record.getSession();
        return AttendanceRecordResponse.builder()
                .scholarNumber(record.getStudent().getScholarNumber())
                .enrollmentNumber(record.getStudent().getEnrollmentNumber())
                .studentName(record.getStudent().getName())
                .scannedAt(record.getScannedAt())
                .date(session.getSessionDate())
                .subject(resolveSessionSubject(session))
                .build();
    }

    private String resolveSessionSubject(AttendanceSession session) {
        if (StringUtils.hasText(session.getExamSubject())) {
            return session.getExamSubject();
        }
        return session.getTeacher().getSubject();
    }
}
