package com.exam.attendance;

import com.exam.attendance.dto.attendance.AttendanceAdjustmentRequest;
import com.exam.attendance.dto.attendance.SessionAttendanceDetailsResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceSummaryResponse;
import com.exam.attendance.dto.teacher.ScanAttendanceResponse;
import com.exam.attendance.entity.*;
import com.exam.attendance.exception.ApiException;
import com.exam.attendance.repository.*;
import com.exam.attendance.service.AdminService;
import com.exam.attendance.service.TeacherService;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AttendanceCorrectionServiceTests {

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private AttendanceAdjustmentRepository attendanceAdjustmentRepository;

    @Autowired
    private AttendanceSessionRosterSnapshotRepository rosterSnapshotRepository;

    @Test
    void adjustmentCanMarkAbsentStudentPresentAndScannedStudentAbsentWithoutChangingScanRecord() {
        Teacher teacher = createTeacher("teacher-one", "T-1001", "Dr. One");
        Student scanned = createStudent("AITR23-0001", "ENR-0001", "Aarav Sharma", "1", "1", "Computer Science and Engineering", "1");
        Student missed = createStudent("AITR23-0002", "ENR-0002", "Nisha Rao", "1", "1", "Computer Science and Engineering", "1");
        createStudent("AITR23-0003", "ENR-0003", "Kabir Sen", "1", "1", "Computer Science and Engineering", "1");

        AttendanceSession session = scanAndGetSession(teacher, scanned.getScholarNumber());
        assertThat(rosterSnapshotRepository.findBySessionOrderByScholarNumberAsc(session)).hasSize(3);

        SessionAttendanceDetailsResponse initial = teacherService.getSessionAttendanceDetails(teacher.getUser().getUsername(), session.getId());
        assertThat(initial.isRosterResolved()).isTrue();
        assertThat(initial.getPresentCount()).isEqualTo(1);
        assertThat(initial.getAbsentCount()).isEqualTo(2);
        assertThat(initial.getTotalCount()).isEqualTo(3);

        SessionAttendanceDetailsResponse afterPresent = teacherService.adjustSessionAttendance(
                teacher.getUser().getUsername(),
                session.getId(),
                adjustment(missed.getScholarNumber(), "PRESENT", "Barcode missed during scanning")
        );
        assertThat(afterPresent.getPresentCount()).isEqualTo(2);
        assertThat(afterPresent.getAbsentCount()).isEqualTo(1);
        assertThat(recordFor(afterPresent, missed.getScholarNumber()).getStatus()).isEqualTo("PRESENT");
        assertThat(recordFor(afterPresent, missed.getScholarNumber()).isAdjusted()).isTrue();

        SessionAttendanceDetailsResponse afterAbsent = teacherService.adjustSessionAttendance(
                teacher.getUser().getUsername(),
                session.getId(),
                adjustment(scanned.getScholarNumber(), "ABSENT", "Marked absent after verification")
        );
        assertThat(afterAbsent.getPresentCount()).isEqualTo(1);
        assertThat(afterAbsent.getAbsentCount()).isEqualTo(2);
        assertThat(recordFor(afterAbsent, scanned.getScholarNumber()).getStatus()).isEqualTo("ABSENT");
        assertThat(attendanceRecordRepository.existsBySessionAndStudent(session, scanned)).isTrue();
    }

    @Test
    void latestAdjustmentWinsAndSummariesMatchDetails() {
        Teacher teacher = createTeacher("teacher-two", "T-1002", "Dr. Two");
        Student student = createStudent("AITR23-0011", "ENR-0011", "Maya Iyer", "1", "1", "Computer Science and Engineering", "1");
        createStudent("AITR23-0012", "ENR-0012", "Rohan Das", "1", "1", "Computer Science and Engineering", "1");

        AttendanceSession session = scanAndGetSession(teacher, student.getScholarNumber());

        teacherService.adjustSessionAttendance(teacher.getUser().getUsername(), session.getId(),
                adjustment(student.getScholarNumber(), "ABSENT", "Marked absent after verification"));
        SessionAttendanceDetailsResponse finalDetails = teacherService.adjustSessionAttendance(teacher.getUser().getUsername(), session.getId(),
                adjustment(student.getScholarNumber(), "PRESENT", "Verified present"));

        assertThat(recordFor(finalDetails, student.getScholarNumber()).getStatus()).isEqualTo("PRESENT");
        assertThat(attendanceAdjustmentRepository.findBySessionOrderByAdjustedAtAscIdAsc(session)).hasSize(2);

        SessionAttendanceSummaryResponse teacherSummary = teacherService.getAttendanceSessionSummaries(teacher.getUser().getUsername()).get(0);
        SessionAttendanceSummaryResponse adminSummary = adminService.getAttendanceSessionSummaries(session.getSessionDate(), null, null).get(0);

        assertSummaryMatchesDetails(teacherSummary, finalDetails);
        assertSummaryMatchesDetails(adminSummary, finalDetails);
    }

    @Test
    void adjustmentPermissionsAndValidationAreEnforced() {
        Teacher owner = createTeacher("teacher-three", "T-1003", "Dr. Three");
        Teacher otherTeacher = createTeacher("teacher-four", "T-1004", "Dr. Four");
        Student scanned = createStudent("AITR23-0021", "ENR-0021", "Sara Khan", "1", "1", "Computer Science and Engineering", "1");
        Student outsideRoster = createStudent("AITR23-0099", "ENR-0099", "Outside Student", "1", "2", "Computer Science and Engineering", "1");

        AttendanceSession session = scanAndGetSession(owner, scanned.getScholarNumber());

        assertThatThrownBy(() -> teacherService.adjustSessionAttendance(otherTeacher.getUser().getUsername(), session.getId(),
                adjustment(scanned.getScholarNumber(), "ABSENT", "Wrong teacher")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Attendance session not found");

        assertThatThrownBy(() -> teacherService.adjustSessionAttendance(owner.getUser().getUsername(), session.getId(),
                adjustment(outsideRoster.getScholarNumber(), "PRESENT", "Outside roster")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Student is not part");

        assertThatThrownBy(() -> teacherService.adjustSessionAttendance(owner.getUser().getUsername(), session.getId(),
                adjustment(scanned.getScholarNumber(), "PRESENT", " ")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Adjustment reason is required");

        assertThatThrownBy(() -> teacherService.adjustSessionAttendance(owner.getUser().getUsername(), session.getId(),
                adjustment(scanned.getScholarNumber(), "LATE", "Invalid status")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Status must be PRESENT or ABSENT");

        SessionAttendanceDetailsResponse adminAdjusted = adminService.adjustAttendanceSession(session.getId(), "admin",
                adjustment(scanned.getScholarNumber(), "ABSENT", "Admin verified absent"));
        assertThat(recordFor(adminAdjusted, scanned.getScholarNumber()).getStatus()).isEqualTo("ABSENT");
    }

    @Test
    void legacyUnresolvedSessionRejectsAdjustment() {
        Teacher teacher = createTeacher("teacher-five", "T-1005", "Dr. Five");
        Student student = createStudent("AITR23-0031", "ENR-0031", "Legacy Student", "1", "1", "Computer Science and Engineering", "1");
        AttendanceSession legacy = attendanceSessionRepository.save(AttendanceSession.builder()
                .teacher(teacher)
                .sessionDate(LocalDate.now())
                .examSubject("Legacy Subject")
                .createdAt(Instant.now())
                .build());
        attendanceRecordRepository.save(AttendanceRecord.builder()
                .session(legacy)
                .student(student)
                .scannedAt(Instant.now())
                .build());

        SessionAttendanceDetailsResponse details = teacherService.getSessionAttendanceDetails(teacher.getUser().getUsername(), legacy.getId());
        assertThat(details.isRosterResolved()).isFalse();
        assertThat(details.getPresentCount()).isEqualTo(1);

        assertThatThrownBy(() -> teacherService.adjustSessionAttendance(teacher.getUser().getUsername(), legacy.getId(),
                adjustment(student.getScholarNumber(), "ABSENT", "Legacy correction")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("legacy session");
    }

    @Test
    void rosterSnapshotPreservesOldSessionAfterStudentPromotion() {
        Teacher teacher = createTeacher("teacher-six", "T-1006", "Dr. Six");
        Student scanned = createStudent("AITR23-0041", "ENR-0041", "Scanned Student", "1", "1", "Computer Science and Engineering", "1");
        Student promotedLater = createStudent("AITR23-0042", "ENR-0042", "Promoted Later", "1", "1", "Computer Science and Engineering", "1");

        AttendanceSession session = scanAndGetSession(teacher, scanned.getScholarNumber());
        promotedLater.setSemester("2");
        studentRepository.save(promotedLater);

        SessionAttendanceDetailsResponse details = teacherService.getSessionAttendanceDetails(teacher.getUser().getUsername(), session.getId());
        assertThat(details.getRecords()).extracting("scholarNumber").contains(promotedLater.getScholarNumber());
        assertThat(recordFor(details, promotedLater.getScholarNumber()).getStatus()).isEqualTo("ABSENT");

        SessionAttendanceDetailsResponse adjusted = teacherService.adjustSessionAttendance(teacher.getUser().getUsername(), session.getId(),
                adjustment(promotedLater.getScholarNumber(), "PRESENT", "Verified present from old roster"));
        assertThat(recordFor(adjusted, promotedLater.getScholarNumber()).getStatus()).isEqualTo("PRESENT");
    }

    @Test
    void pdfExportsUseSameSessionRecordColumns() throws Exception {
        Teacher teacher = createTeacher("teacher-seven", "T-1007", "Dr. Seven");
        Student scanned = createStudent("AITR23-0051", "ENR-0051", "PDF Scanned", "1", "1", "Computer Science and Engineering", "1");
        Student missed = createStudent("AITR23-0052", "ENR-0052", "PDF Missed", "1", "1", "Computer Science and Engineering", "1");

        AttendanceSession session = scanAndGetSession(teacher, scanned.getScholarNumber());
        adminService.adjustAttendanceSession(session.getId(), "admin", adjustment(missed.getScholarNumber(), "PRESENT", "Verified manually"));

        assertPdfHasStandardColumns(teacherService.generateSessionPdfReport(teacher.getUser().getUsername(), session.getId()));
        assertPdfHasStandardColumns(adminService.generateAttendanceSessionPdf(session.getId()));
        assertPdfHasStandardColumns(adminService.generateAttendancePdf(null, null, null));
    }

    @Test
    void excelExportsUseFlatAttendanceColumnsAndAdjustmentReason() throws Exception {
        Teacher teacher = createTeacher("teacher-eight", "T-1008", "Dr. Eight");
        Student scanned = createStudent("AITR23-0061", "ENR-0061", "Excel Scanned", "1", "1", "Computer Science and Engineering", "1");
        Student missed = createStudent("AITR23-0062", "ENR-0062", "Excel Missed", "1", "1", "Computer Science and Engineering", "1");

        AttendanceSession session = scanAndGetSession(teacher, scanned.getScholarNumber());
        adminService.adjustAttendanceSession(session.getId(), "admin", adjustment(missed.getScholarNumber(), "PRESENT", "Verified for Excel"));

        assertExcelHasStandardColumnsAndReason(teacherService.generateSessionExcelReport(teacher.getUser().getUsername(), session.getId()));
        assertExcelHasStandardColumnsAndReason(adminService.generateAttendanceSessionExcel(session.getId()));
        assertExcelHasStandardColumnsAndReason(adminService.generateAttendanceExcel(null, null, null));
    }

    private AttendanceSession scanAndGetSession(Teacher teacher, String scholarNumber) {
        ScanAttendanceResponse response = teacherService.scan(
                teacher.getUser().getUsername(),
                scholarNumber,
                "Engineering Physics",
                "1",
                "1",
                "Computer Science and Engineering",
                "1",
                false
        );
        assertThat(response.isDuplicate()).isFalse();
        return attendanceSessionRepository.findByTeacherOrderBySessionDateDescCreatedAtDesc(teacher).get(0);
    }

    private Teacher createTeacher(String username, String teacherCode, String name) {
        User user = userRepository.save(User.builder()
                .username(username)
                .password("password")
                .role(Role.TEACHER)
                .enabled(true)
                .build());
        return teacherRepository.save(Teacher.builder()
                .teacherCode(teacherCode)
                .name(name)
                .subject("Engineering Physics")
                .user(user)
                .build());
    }

    private Student createStudent(String scholarNumber,
                                  String enrollmentNumber,
                                  String name,
                                  String year,
                                  String semester,
                                  String branch,
                                  String section) {
        return studentRepository.save(Student.builder()
                .scholarNumber(scholarNumber)
                .enrollmentNumber(enrollmentNumber)
                .name(name)
                .year(year)
                .semester(semester)
                .department(branch)
                .section(section)
                .build());
    }

    private AttendanceAdjustmentRequest adjustment(String scholarNumber, String status, String reason) {
        AttendanceAdjustmentRequest request = new AttendanceAdjustmentRequest();
        request.setScholarNumber(scholarNumber);
        request.setStatus(status);
        request.setReason(reason);
        return request;
    }

    private SessionAttendanceStudentRecordView recordFor(SessionAttendanceDetailsResponse details, String scholarNumber) {
        return details.getRecords().stream()
                .filter(record -> scholarNumber.equals(record.getScholarNumber()))
                .findFirst()
                .map(record -> new SessionAttendanceStudentRecordView(record.getStatus(), record.isAdjusted(), record.getScholarNumber()))
                .orElseThrow();
    }

    private void assertSummaryMatchesDetails(SessionAttendanceSummaryResponse summary, SessionAttendanceDetailsResponse details) {
        assertThat(summary.getSessionId()).isEqualTo(details.getSessionId());
        assertThat(summary.getPresentCount()).isEqualTo(details.getPresentCount());
        assertThat(summary.getAbsentCount()).isEqualTo(details.getAbsentCount());
        assertThat(summary.getTotalCount()).isEqualTo(details.getTotalCount());
        assertThat(summary.isRosterResolved()).isEqualTo(details.isRosterResolved());
    }

    private void assertPdfHasStandardColumns(byte[] pdfBytes) throws IOException {
        String text = pdfText(pdfBytes);
        assertThat(text).contains("S. No.");
        assertThat(text).contains("Scholar No.");
        assertThat(text).contains("Enrollment No.");
        assertThat(text).contains("Student Name");
        assertThat(text).contains("Status");
        assertThat(text).contains("Scan Time");
        assertThat(text).contains("Adjusted");
        assertThat(text).contains("Reason");
    }

    private void assertExcelHasStandardColumnsAndReason(byte[] excelBytes) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(excelBytes))) {
            Sheet sheet = workbook.getSheet("Attendance");
            assertThat(sheet).isNotNull();

            Row header = sheet.getRow(2);
            assertThat(header.getCell(0).getStringCellValue()).isEqualTo("Session ID");
            assertThat(header.getCell(9).getStringCellValue()).isEqualTo("S. No.");
            assertThat(header.getCell(10).getStringCellValue()).isEqualTo("Scholar No.");
            assertThat(header.getCell(11).getStringCellValue()).isEqualTo("Enrollment No.");
            assertThat(header.getCell(12).getStringCellValue()).isEqualTo("Student Name");
            assertThat(header.getCell(13).getStringCellValue()).isEqualTo("Status");
            assertThat(header.getCell(14).getStringCellValue()).isEqualTo("Scan Time");
            assertThat(header.getCell(15).getStringCellValue()).isEqualTo("Adjusted");
            assertThat(header.getCell(16).getStringCellValue()).isEqualTo("Reason");

            String sheetText = new StringBuilder()
                    .append(sheet.getRow(3).getCell(12).getStringCellValue()).append(' ')
                    .append(sheet.getRow(4).getCell(12).getStringCellValue()).append(' ')
                    .append(sheet.getRow(3).getCell(16).getStringCellValue()).append(' ')
                    .append(sheet.getRow(4).getCell(16).getStringCellValue())
                    .toString();
            assertThat(sheetText).contains("Verified for Excel");
        }
    }

    private String pdfText(byte[] pdfBytes) throws IOException {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
            return new PDFTextStripper().getText(document);
        }
    }

    private record SessionAttendanceStudentRecordView(String getStatus, boolean isAdjusted, String getScholarNumber) {
    }
}
