package com.exam.attendance.controller;

import com.exam.attendance.dto.teacher.AttendanceRecordResponse;
import com.exam.attendance.dto.teacher.ScanAttendanceRequest;
import com.exam.attendance.dto.teacher.ScanAttendanceResponse;
import com.exam.attendance.dto.teacher.TeacherProfileResponse;
import com.exam.attendance.dto.admin.SubjectResponse;
import com.exam.attendance.dto.attendance.AttendanceAdjustmentRequest;
import com.exam.attendance.dto.attendance.SessionAttendanceDetailsResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceSummaryResponse;
import com.exam.attendance.service.AttendanceExcelService;
import com.exam.attendance.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private static final DateTimeFormatter PDF_FILE_TS_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final TeacherService teacherService;

    @GetMapping("/profile")
    public TeacherProfileResponse profile(Authentication authentication) {
        return teacherService.getProfile(authentication.getName());
    }

    @PostMapping("/attendance/scan")
    public ScanAttendanceResponse scanAttendance(@Valid @RequestBody ScanAttendanceRequest request,
                                                 Authentication authentication) {
        return teacherService.scan(
            authentication.getName(),
            request.getScholarNumber(),
            request.getExamSubject(),
            request.getExamYear(),
            request.getExamSemester(),
            request.getExamBranch(),
            request.getExamSection(),
            Boolean.TRUE.equals(request.getCaseSensitive())
        );
    }

    @GetMapping("/attendance/session")
    public List<AttendanceRecordResponse> sessionAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "time") String sortBy,
            Authentication authentication) {
        return teacherService.getSessionAttendance(authentication.getName(), date, sortBy);
    }

    @GetMapping("/attendance/history")
    public List<AttendanceRecordResponse> attendanceHistory(Authentication authentication) {
        return teacherService.getAttendanceHistory(authentication.getName());
    }

    @GetMapping("/attendance/sessions")
    public List<SessionAttendanceSummaryResponse> attendanceSessions(Authentication authentication) {
        return teacherService.getAttendanceSessionSummaries(authentication.getName());
    }

    @GetMapping("/attendance/sessions/{sessionId}")
    public SessionAttendanceDetailsResponse attendanceSessionDetails(@PathVariable Long sessionId,
                                                                     Authentication authentication) {
        return teacherService.getSessionAttendanceDetails(authentication.getName(), sessionId);
    }

    @GetMapping("/attendance/sessions/{sessionId}/report/pdf")
    public ResponseEntity<byte[]> attendanceSessionPdf(@PathVariable Long sessionId,
                                                       Authentication authentication) {
        byte[] data = teacherService.generateSessionPdfReport(authentication.getName(), sessionId);
        String filename = "attendance-session-" + sessionId + "-" + LocalDateTime.now().format(PDF_FILE_TS_FORMAT) + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/attendance/sessions/{sessionId}/report/excel")
    public ResponseEntity<byte[]> attendanceSessionExcel(@PathVariable Long sessionId,
                                                         Authentication authentication) {
        byte[] data = teacherService.generateSessionExcelReport(authentication.getName(), sessionId);
        String filename = "attendance-session-" + sessionId + "-" + LocalDateTime.now().format(PDF_FILE_TS_FORMAT) + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType(AttendanceExcelService.CONTENT_TYPE))
                .body(data);
    }

    @PostMapping("/attendance/sessions/{sessionId}/adjust")
    public SessionAttendanceDetailsResponse adjustAttendanceSession(@PathVariable Long sessionId,
                                                                    @Valid @RequestBody AttendanceAdjustmentRequest request,
                                                                    Authentication authentication) {
        return teacherService.adjustSessionAttendance(authentication.getName(), sessionId, request);
    }

    @GetMapping("/attendance/report/pdf")
    public ResponseEntity<byte[]> attendancePdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String examYear,
            @RequestParam(required = false) String examSemester,
            @RequestParam(required = false) String examBranch,
            @RequestParam(required = false) String examSection,
            Authentication authentication) {

        byte[] data = teacherService.generatePdfReport(
                authentication.getName(),
                date,
                subject,
                examYear,
                examSemester,
                examBranch,
                examSection
        );
        String filename = "attendance-" + date + "-" + LocalDateTime.now().format(PDF_FILE_TS_FORMAT) + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/students/search")
    public AttendanceRecordResponse searchStudent(@RequestParam String scholarNumber) {
        return teacherService.searchStudent(scholarNumber);
    }

    @GetMapping("/subjects")
    public List<SubjectResponse> subjects() {
        return teacherService.getSubjects();
    }
}
