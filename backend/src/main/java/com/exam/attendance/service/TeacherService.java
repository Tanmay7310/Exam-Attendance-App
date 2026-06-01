package com.exam.attendance.service;

import com.exam.attendance.dto.admin.SubjectResponse;
import com.exam.attendance.dto.attendance.AttendanceAdjustmentRequest;
import com.exam.attendance.dto.attendance.SessionAttendanceDetailsResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceSummaryResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceStudentRecordResponse;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeacherService {
    private static final Map<String, String> BRANCH_ALIAS_MAP = buildBranchAliasMap();
    private static final Map<String, String> YEAR_ALIAS_MAP = buildYearAliasMap();
    private static final Map<String, String> SEMESTER_ALIAS_MAP = buildSemesterAliasMap();


    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SubjectMasterRepository subjectMasterRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceAdjustmentRepository attendanceAdjustmentRepository;
    private final AttendanceRosterService attendanceRosterService;
    private final PdfService pdfService;

    private record NormalizedExamContext(String year, String semester, String branch, String section) {}

    public TeacherProfileResponse getProfile(String username) {
        Teacher teacher = getTeacherByUsername(username);
        return TeacherProfileResponse.builder()
                .teacherCode(teacher.getTeacherCode())
                .name(teacher.getName())
                .subject(teacher.getSubject())
                .build();
    }

    @Transactional
    public ScanAttendanceResponse scan(String username,
                                       String scholarNumber,
                                       String examSubject,
                                       String examYear,
                                       String examSemester,
                                       String examBranch,
                                       String examSection,
                                       boolean caseSensitive) {
        try {
            Teacher teacher = getTeacherByUsername(username);
            String normalizedScholarNumber = scholarNumber.trim();
            NormalizedExamContext examContext = validateExamDetailsInputs(examYear, examSemester, examBranch, examSection);

            Student student = (caseSensitive
                    ? studentRepository.findByScholarNumberCaseSensitive(normalizedScholarNumber)
                    : studentRepository.findByScholarNumber(normalizedScholarNumber))
                    .orElseThrow(() -> new ApiException("Student not found for scholar number: " + normalizedScholarNumber));

            validateStudentExamEligibility(student, examContext);

            LocalDate today = LocalDate.now();
            AttendanceSession session = findOrCreateSession(teacher, today, examSubject, examContext);

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

    public List<SessionAttendanceSummaryResponse> getAttendanceSessionSummaries(String username) {
        Teacher teacher = getTeacherByUsername(username);
        return attendanceSessionRepository.findByTeacherOrderBySessionDateDescCreatedAtDesc(teacher).stream()
                .map(this::buildSessionAttendanceSummary)
                .toList();
    }

    public SessionAttendanceDetailsResponse getSessionAttendanceDetails(String username, Long sessionId) {
        Teacher teacher = getTeacherByUsername(username);
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("Attendance session not found"));

        if (!session.getTeacher().getId().equals(teacher.getId())) {
            throw new ApiException("Attendance session not found");
        }

        return buildSessionAttendanceDetails(session);
    }

    @Transactional
    public SessionAttendanceDetailsResponse adjustSessionAttendance(String username, Long sessionId, AttendanceAdjustmentRequest request) {
        Teacher teacher = getTeacherByUsername(username);
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException("Attendance session not found"));

        if (!session.getTeacher().getId().equals(teacher.getId())) {
            throw new ApiException("Attendance session not found");
        }

        saveAttendanceAdjustment(session, username, request);
        return buildSessionAttendanceDetails(session);
    }

    public byte[] generatePdfReport(String username,
                                    LocalDate date,
                                    String subject,
                                    String examYear,
                                    String examSemester,
                                    String examBranch,
                                    String examSection) {
        Teacher teacher = getTeacherByUsername(username);
        AttendanceSession session = resolveSessionForReport(teacher, date, subject, examYear, examSemester, examBranch, examSection);
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

    private AttendanceSession resolveSessionForReport(Teacher teacher,
                                                      LocalDate date,
                                                      String subject,
                                                      String examYear,
                                                      String examSemester,
                                                      String examBranch,
                                                      String examSection) {
        String normalizedSubject = normalizeSubject(subject);
        String normalizedYear = normalizeYear(examYear);
        String normalizedSemester = normalizeSemester(examSemester);
        String normalizedBranch = normalizeBranch(examBranch);
        String normalizedSection = normalizeSection(examSection);
        boolean hasClassFilter = StringUtils.hasText(normalizedYear)
                || StringUtils.hasText(normalizedSemester)
                || StringUtils.hasText(normalizedBranch)
                || StringUtils.hasText(normalizedSection);

        List<AttendanceSession> sessions = attendanceSessionRepository.findByTeacherAndSessionDate(teacher, date).stream()
                .filter(session -> !StringUtils.hasText(normalizedSubject)
                        || normalizedSubject.equalsIgnoreCase(resolveSessionSubject(session)))
                .filter(session -> {
                    if (!hasClassFilter) {
                        return true;
                    }
                    String sessionYear = normalizeYear(resolveSessionYear(session, null));
                    String sessionSemester = normalizeSemester(resolveSessionSemester(session, null));
                    String sessionBranch = normalizeBranch(resolveSessionBranch(session, null));
                    String sessionSection = normalizeSection(resolveSessionSection(session, null));
                    return (!StringUtils.hasText(normalizedYear) || normalizedYear.equals(sessionYear))
                            && (!StringUtils.hasText(normalizedSemester) || normalizedSemester.equals(sessionSemester))
                            && (!StringUtils.hasText(normalizedBranch) || normalizedBranch.equals(sessionBranch))
                            && (!StringUtils.hasText(normalizedSection) || normalizedSection.equals(sessionSection));
                })
                .sorted(Comparator.comparing(AttendanceSession::getCreatedAt))
                .toList();

        if (sessions.isEmpty()) {
            return null;
        }

        if (!StringUtils.hasText(normalizedSubject)) {
            return sessions.get(0);
        }

        return sessions.get(0);
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

    public List<SubjectResponse> getSubjects() {
        return subjectMasterRepository.findAll().stream()
                .sorted((a, b) -> {
                    String branchA = StringUtils.hasText(a.getBranch()) ? a.getBranch().trim() : "";
                    String branchB = StringUtils.hasText(b.getBranch()) ? b.getBranch().trim() : "";
                    int byBranch = branchA.compareToIgnoreCase(branchB);
                    if (byBranch != 0) return byBranch;

                    String semA = StringUtils.hasText(a.getSemester()) ? a.getSemester().trim() : "";
                    String semB = StringUtils.hasText(b.getSemester()) ? b.getSemester().trim() : "";
                    int bySemester = semA.compareToIgnoreCase(semB);
                    if (bySemester != 0) return bySemester;

                    String nameA = StringUtils.hasText(a.getName()) ? a.getName().trim() : "";
                    String nameB = StringUtils.hasText(b.getName()) ? b.getName().trim() : "";
                    return nameA.compareToIgnoreCase(nameB);
                })
                .map(subject -> SubjectResponse.builder()
                        .id(subject.getId())
                        .name(StringUtils.hasText(subject.getName()) ? subject.getName().trim() : "")
                        .subjectCode(StringUtils.hasText(subject.getSubjectCode()) ? subject.getSubjectCode().trim() : "")
                        .branch(StringUtils.hasText(subject.getBranch()) ? subject.getBranch().trim() : "")
                        .semester(StringUtils.hasText(subject.getSemester()) ? subject.getSemester().trim() : "")
                        .build())
                .toList();
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

    private AttendanceSession findOrCreateSession(Teacher teacher, LocalDate date, String examSubject, NormalizedExamContext context) {
        String normalizedSubject = normalizeSubject(examSubject);
        AttendanceSession existing = normalizedSubject == null
                ? attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubjectIsNullAndExamYearAndExamSemesterAndExamBranchAndExamSection(
                        teacher, date, context.year(), context.semester(), context.branch(), context.section()
                  ).orElse(null)
                : attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubjectAndExamYearAndExamSemesterAndExamBranchAndExamSection(
                        teacher, date, normalizedSubject, context.year(), context.semester(), context.branch(), context.section()
                  ).orElse(null);
        if (existing != null) {
            attendanceRosterService.ensureRosterSnapshot(existing);
            return existing;
        }

        AttendanceSession newSession = AttendanceSession.builder()
            .teacher(teacher)
            .sessionDate(date)
            .examSubject(normalizedSubject)
            .examYear(context.year())
            .examSemester(context.semester())
            .examBranch(context.branch())
            .examSection(context.section())
            .createdAt(Instant.now())
            .build();

        try {
            AttendanceSession saved = attendanceSessionRepository.save(newSession);
            attendanceRosterService.ensureRosterSnapshot(saved);
            return saved;
        } catch (DataIntegrityViolationException ex) {
            if (isLegacySessionConstraintConflict(ex)) {
                throw new ApiException("Subject-wise scanning requires DB migration for attendance sessions. Please contact admin.");
            }

            AttendanceSession existingAfterConflict = normalizedSubject == null
                    ? attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubjectIsNullAndExamYearAndExamSemesterAndExamBranchAndExamSection(
                            teacher, date, context.year(), context.semester(), context.branch(), context.section()
                      )
                            .orElseThrow(() -> new ApiException("Unable to create attendance session"))
                    : attendanceSessionRepository.findByTeacherAndSessionDateAndExamSubjectAndExamYearAndExamSemesterAndExamBranchAndExamSection(
                            teacher, date, normalizedSubject, context.year(), context.semester(), context.branch(), context.section()
                      )
                            .orElseThrow(() -> new ApiException("Unable to create attendance session"));
            attendanceRosterService.ensureRosterSnapshot(existingAfterConflict);
            return existingAfterConflict;
        }
    }

    private boolean isLegacySessionConstraintConflict(DataIntegrityViolationException ex) {
        String message = ex.getMessage();
        if (message == null) {
            return false;
        }
        String normalized = message.toLowerCase();
        if (normalized.contains("uk_session_teacher_date_subject_class")) {
            return false;
        }
        return normalized.contains("uk_session_teacher_date");
    }

    private String normalizeSubject(String subject) {
        return StringUtils.hasText(subject) ? subject.trim() : null;
    }

    private AttendanceRecordResponse toAttendanceRecordResponse(AttendanceRecord record) {
        AttendanceSession session = record.getSession();
        return AttendanceRecordResponse.builder()
                .sessionId(session.getId())
                .scholarNumber(record.getStudent().getScholarNumber())
                .enrollmentNumber(record.getStudent().getEnrollmentNumber())
                .studentName(record.getStudent().getName())
                .scannedAt(record.getScannedAt())
                .date(session.getSessionDate())
                .subject(resolveSessionSubject(session))
                .examYear(resolveSessionYear(session, record.getStudent()))
                .examSemester(resolveSessionSemester(session, record.getStudent()))
                .examBranch(resolveSessionBranch(session, record.getStudent()))
                .examSection(resolveSessionSection(session, record.getStudent()))
                .build();
    }

    private SessionAttendanceDetailsResponse buildSessionAttendanceDetails(AttendanceSession session) {
        List<AttendanceRecord> presentRecords = attendanceRecordRepository.findBySessionOrderByStudent_ScholarNumberAsc(session);
        Map<Long, AttendanceRecord> presentByStudentId = new HashMap<>();
        for (AttendanceRecord record : presentRecords) {
            presentByStudentId.put(record.getStudent().getId(), record);
        }

        Map<Long, AttendanceAdjustment> latestAdjustmentByStudentId = latestAdjustmentsByStudentId(session);
        AttendanceRosterService.RosterResolution roster = attendanceRosterService.resolveRoster(session);
        boolean rosterResolved = roster.rosterResolved();

        List<SessionAttendanceStudentRecordResponse> rows = new ArrayList<>();

        if (rosterResolved) {
            Set<Long> rosterStudentIds = new HashSet<>();

            for (AttendanceSessionRosterSnapshot snapshot : roster.snapshots()) {
                Long studentId = snapshot.getStudent().getId();
                rosterStudentIds.add(studentId);
                AttendanceRecord presentRecord = presentByStudentId.get(studentId);
                AttendanceAdjustment adjustment = latestAdjustmentByStudentId.get(studentId);
                rows.add(toSessionStudentRecord(session, snapshot, presentRecord, adjustment));
            }

            for (AttendanceRecord record : presentRecords) {
                if (!rosterStudentIds.contains(record.getStudent().getId())) {
                    Student student = record.getStudent();
                    AttendanceAdjustment adjustment = latestAdjustmentByStudentId.get(student.getId());
                    rows.add(toSessionStudentRecord(session, student, record, adjustment));
                }
            }

            rows = rows.stream()
                    .sorted(Comparator.comparing(row -> row.getScholarNumber().toLowerCase()))
                    .toList();
        } else {
            rows = presentRecords.stream()
                    .map(record -> toSessionStudentRecord(session, record.getStudent(), record, latestAdjustmentByStudentId.get(record.getStudent().getId())))
                    .toList();
        }

        int presentCount = (int) rows.stream().filter(row -> "PRESENT".equals(row.getStatus())).count();
        int totalCount = rows.size();
        int absentCount = Math.max(0, totalCount - presentCount);

        return SessionAttendanceDetailsResponse.builder()
                .sessionId(session.getId())
                .date(session.getSessionDate())
                .subject(resolveSessionSubject(session))
                .examYear(resolveSessionYear(session, null))
                .examSemester(resolveSessionSemester(session, null))
                .examBranch(resolveSessionBranch(session, null))
                .examSection(resolveSessionSection(session, null))
                .rosterResolved(rosterResolved)
                .presentCount(presentCount)
                .absentCount(absentCount)
                .totalCount(totalCount)
                .records(rows)
                .build();
    }

    private void saveAttendanceAdjustment(AttendanceSession session, String adjustedBy, AttendanceAdjustmentRequest request) {
        AttendanceRosterService.RosterResolution roster = attendanceRosterService.resolveRoster(session);
        if (!roster.rosterResolved()) {
            throw new ApiException("Attendance corrections are unavailable for this legacy session.");
        }

        String scholarNumber = request.getScholarNumber() != null ? request.getScholarNumber().trim() : "";
        String reason = request.getReason() != null ? request.getReason().trim() : "";
        if (!StringUtils.hasText(scholarNumber)) {
            throw new ApiException("Scholar number is required");
        }
        if (!StringUtils.hasText(reason)) {
            throw new ApiException("Adjustment reason is required");
        }
        if (reason.length() > 255) {
            throw new ApiException("Adjustment reason must be 255 characters or fewer");
        }

        AttendanceAdjustmentStatus status = parseAdjustmentStatus(request.getStatus());
        AttendanceSessionRosterSnapshot rosterStudent = roster.snapshots().stream()
                .filter(candidate -> candidate.getScholarNumber() != null && candidate.getScholarNumber().trim().equals(scholarNumber))
                .findFirst()
                .orElseThrow(() -> new ApiException("Student is not part of this attendance session roster"));

        attendanceAdjustmentRepository.save(AttendanceAdjustment.builder()
                .session(session)
                .student(rosterStudent.getStudent())
                .status(status)
                .reason(reason)
                .adjustedBy(StringUtils.hasText(adjustedBy) ? adjustedBy.trim() : "system")
                .adjustedAt(Instant.now())
                .build());
    }

    private AttendanceAdjustmentStatus parseAdjustmentStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new ApiException("Status is required");
        }
        try {
            return AttendanceAdjustmentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException("Status must be PRESENT or ABSENT");
        }
    }

    private Map<Long, AttendanceAdjustment> latestAdjustmentsByStudentId(AttendanceSession session) {
        Map<Long, AttendanceAdjustment> latest = new HashMap<>();
        for (AttendanceAdjustment adjustment : attendanceAdjustmentRepository.findBySessionOrderByAdjustedAtAscIdAsc(session)) {
            latest.put(adjustment.getStudent().getId(), adjustment);
        }
        return latest;
    }

    private SessionAttendanceSummaryResponse buildSessionAttendanceSummary(AttendanceSession session) {
        SessionAttendanceDetailsResponse details = buildSessionAttendanceDetails(session);
        return SessionAttendanceSummaryResponse.builder()
                .sessionId(details.getSessionId())
                .date(details.getDate())
                .subject(details.getSubject())
                .teacherName(session.getTeacher().getName())
                .teacherCode(session.getTeacher().getTeacherCode())
                .examYear(details.getExamYear())
                .examSemester(details.getExamSemester())
                .examBranch(details.getExamBranch())
                .examSection(details.getExamSection())
                .presentCount(details.getPresentCount())
                .absentCount(details.getAbsentCount())
                .totalCount(details.getTotalCount())
                .rosterResolved(details.isRosterResolved())
                .build();
    }

    private SessionAttendanceStudentRecordResponse toSessionStudentRecord(
            AttendanceSession session,
            Student student,
            AttendanceRecord presentRecord,
            AttendanceAdjustment adjustment
    ) {
        boolean adjusted = adjustment != null;
        String status = adjusted
                ? adjustment.getStatus().name()
                : presentRecord != null ? "PRESENT" : "ABSENT";

        return SessionAttendanceStudentRecordResponse.builder()
                .scholarNumber(student.getScholarNumber())
                .enrollmentNumber(student.getEnrollmentNumber())
                .studentName(student.getName())
                .status(status)
                .scannedAt(presentRecord != null ? presentRecord.getScannedAt() : null)
                .teacherName(session.getTeacher().getName())
                .teacherCode(session.getTeacher().getTeacherCode())
                .adjusted(adjusted)
                .adjustedBy(adjusted ? adjustment.getAdjustedBy() : null)
                .adjustedAt(adjusted ? adjustment.getAdjustedAt() : null)
                .adjustmentReason(adjusted ? adjustment.getReason() : null)
                .build();
    }

    private SessionAttendanceStudentRecordResponse toSessionStudentRecord(
            AttendanceSession session,
            AttendanceSessionRosterSnapshot snapshot,
            AttendanceRecord presentRecord,
            AttendanceAdjustment adjustment
    ) {
        boolean adjusted = adjustment != null;
        String status = adjusted
                ? adjustment.getStatus().name()
                : presentRecord != null ? "PRESENT" : "ABSENT";

        return SessionAttendanceStudentRecordResponse.builder()
                .scholarNumber(snapshot.getScholarNumber())
                .enrollmentNumber(snapshot.getEnrollmentNumber())
                .studentName(snapshot.getStudentName())
                .status(status)
                .scannedAt(presentRecord != null ? presentRecord.getScannedAt() : null)
                .teacherName(session.getTeacher().getName())
                .teacherCode(session.getTeacher().getTeacherCode())
                .adjusted(adjusted)
                .adjustedBy(adjusted ? adjustment.getAdjustedBy() : null)
                .adjustedAt(adjusted ? adjustment.getAdjustedAt() : null)
                .adjustmentReason(adjusted ? adjustment.getReason() : null)
                .build();
    }

    private boolean hasClassSnapshot(AttendanceSession session) {
        return StringUtils.hasText(session.getExamYear())
                && StringUtils.hasText(session.getExamSemester())
                && StringUtils.hasText(session.getExamBranch())
                && StringUtils.hasText(session.getExamSection());
    }

    private List<Student> resolveEligibleStudents(AttendanceSession session) {
        String sessionYear = normalizeYear(session.getExamYear());
        String sessionSemester = normalizeSemester(session.getExamSemester());
        String sessionBranch = normalizeBranch(session.getExamBranch());
        String sessionSection = normalizeSection(session.getExamSection());

        return studentRepository.findAll().stream()
                .filter(student -> StringUtils.hasText(student.getYear())
                        && StringUtils.hasText(student.getSemester())
                        && StringUtils.hasText(student.getDepartment())
                        && StringUtils.hasText(student.getSection()))
                .filter(student -> normalizeYear(student.getYear()).equals(sessionYear)
                        && normalizeSemester(student.getSemester()).equals(sessionSemester)
                        && normalizeBranch(student.getDepartment()).equals(sessionBranch)
                        && normalizeSection(student.getSection()).equals(sessionSection))
                .sorted(Comparator.comparing(student -> student.getScholarNumber().toLowerCase()))
                .toList();
    }

    private String resolveSessionSubject(AttendanceSession session) {
        if (StringUtils.hasText(session.getExamSubject())) {
            return session.getExamSubject();
        }
        return session.getTeacher().getSubject();
    }

    private void validateStudentExamEligibility(Student student, NormalizedExamContext examContext) {
        if (!StringUtils.hasText(student.getYear())
                || !StringUtils.hasText(student.getSemester())
                || !StringUtils.hasText(student.getDepartment())
                || !StringUtils.hasText(student.getSection())) {
            throw new ApiException("Student academic details are incomplete. Update year, semester, branch and section in Student Management.");
        }

        String expectedYear = normalizeYear(student.getYear());
        String expectedSemester = normalizeSemester(student.getSemester());
        String expectedBranch = normalizeBranch(student.getDepartment());
        String expectedSection = normalizeSection(student.getSection());

        if (!expectedYear.equals(examContext.year())
                || !expectedSemester.equals(examContext.semester())
                || !expectedBranch.equals(examContext.branch())
                || !expectedSection.equals(examContext.section())) {
            throw new ApiException(
                    "Scan blocked: student belongs to Year " + student.getYear().trim()
                            + ", Semester " + student.getSemester().trim()
                            + ", Branch " + student.getDepartment().trim()
                            + ", Section " + student.getSection().trim()
                            + "."
            );
        }
    }

    private NormalizedExamContext validateExamDetailsInputs(String examYear,
                                                            String examSemester,
                                                            String examBranch,
                                                            String examSection) {
        String actualYear = normalizeYear(examYear);
        String actualSemester = normalizeSemester(examSemester);
        String actualBranch = normalizeBranch(examBranch);
        String actualSection = normalizeSection(examSection);

        if (!StringUtils.hasText(actualYear)
                || !StringUtils.hasText(actualSemester)
                || !StringUtils.hasText(actualBranch)
                || !StringUtils.hasText(actualSection)) {
            throw new ApiException("Exam details are incomplete. Please re-enter Year, Semester, Branch and Section.");
        }

        return new NormalizedExamContext(actualYear, actualSemester, actualBranch, actualSection);
    }

    private String resolveSessionYear(AttendanceSession session, Student fallbackStudent) {
        if (StringUtils.hasText(session.getExamYear())) {
            return session.getExamYear();
        }
        return fallbackStudent != null ? fallbackStudent.getYear() : null;
    }

    private String resolveSessionSemester(AttendanceSession session, Student fallbackStudent) {
        if (StringUtils.hasText(session.getExamSemester())) {
            return session.getExamSemester();
        }
        return fallbackStudent != null ? fallbackStudent.getSemester() : null;
    }

    private String resolveSessionBranch(AttendanceSession session, Student fallbackStudent) {
        if (StringUtils.hasText(session.getExamBranch())) {
            return session.getExamBranch();
        }
        return fallbackStudent != null ? fallbackStudent.getDepartment() : null;
    }

    private String resolveSessionSection(AttendanceSession session, Student fallbackStudent) {
        if (StringUtils.hasText(session.getExamSection())) {
            return session.getExamSection();
        }
        return fallbackStudent != null ? fallbackStudent.getSection() : null;
    }

    private String normalizeBranch(String value) {
        String key = normalizeAliasKey(value);
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return BRANCH_ALIAS_MAP.getOrDefault(key, key);
    }

    private String normalizeYear(String value) {
        String key = normalizeAliasKey(value);
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return YEAR_ALIAS_MAP.getOrDefault(key, key);
    }

    private String normalizeSemester(String value) {
        String key = normalizeAliasKey(value);
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return SEMESTER_ALIAS_MAP.getOrDefault(key, key);
    }

    private String normalizeSection(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim().toLowerCase();
    }

    private static Map<String, String> buildBranchAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addAlias(aliases, "computerscienceandengineering", "cse", "cs", "computerscienceengineering", "computerscience");
        addAlias(aliases, "informationtechnology", "it");
        addAlias(aliases, "electronicsandcommunicationengineering", "ece", "ec", "electronicscommunicationengineering", "electronicsandcommunication");
        addAlias(aliases, "civilengineering", "ce", "civil");
        addAlias(aliases, "mechanicalengineering", "me", "mech", "mechanical");
        addAlias(aliases, "csit");
        addAlias(aliases, "aiml");
        addAlias(aliases, "ds");
        addAlias(aliases, "cybersecurity", "cyber");
        addAlias(aliases, "iot");
        return aliases;
    }

    private static Map<String, String> buildYearAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addAlias(aliases, "1", "1st", "first", "year1", "y1");
        addAlias(aliases, "2", "2nd", "second", "year2", "y2");
        addAlias(aliases, "3", "3rd", "third", "year3", "y3");
        addAlias(aliases, "4", "4th", "fourth", "year4", "y4");
        return aliases;
    }

    private static Map<String, String> buildSemesterAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addAlias(aliases, "1", "1st", "sem1", "semester1", "s1", "i", "first");
        addAlias(aliases, "2", "2nd", "sem2", "semester2", "s2", "ii", "second");
        addAlias(aliases, "3", "3rd", "sem3", "semester3", "s3", "iii", "third");
        addAlias(aliases, "4", "4th", "sem4", "semester4", "s4", "iv", "fourth");
        addAlias(aliases, "5", "5th", "sem5", "semester5", "s5", "v", "fifth");
        addAlias(aliases, "6", "6th", "sem6", "semester6", "s6", "vi", "sixth");
        addAlias(aliases, "7", "7th", "sem7", "semester7", "s7", "vii", "seventh");
        addAlias(aliases, "8", "8th", "sem8", "semester8", "s8", "viii", "eighth");
        return aliases;
    }

    private static void addAlias(Map<String, String> aliases, String canonical, String... options) {
        aliases.put(canonical, canonical);
        for (String option : options) {
            aliases.put(normalizeAliasKey(option), canonical);
        }
    }

    private static String normalizeAliasKey(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }
}
