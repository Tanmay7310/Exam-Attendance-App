package com.exam.attendance.controller;

import com.exam.attendance.dto.admin.AdminAttendanceResponse;
import com.exam.attendance.dto.admin.CreateStudentRequest;
import com.exam.attendance.dto.admin.CreateSubjectRequest;
import com.exam.attendance.dto.admin.CreateTeacherRequest;
import com.exam.attendance.dto.admin.DeleteSubjectsByBatchResponse;
import com.exam.attendance.dto.admin.ImportStudentsResponse;
import com.exam.attendance.dto.admin.ImportSubjectsResponse;
import com.exam.attendance.dto.admin.ImportTeachersResponse;
import com.exam.attendance.dto.admin.StudentPromotionBatchDetailResponse;
import com.exam.attendance.dto.admin.StudentPromotionBatchSummaryResponse;
import com.exam.attendance.dto.admin.StudentPromotionExecuteRequest;
import com.exam.attendance.dto.admin.StudentPromotionPreviewRequest;
import com.exam.attendance.dto.admin.StudentPromotionPreviewResponse;
import com.exam.attendance.dto.admin.StudentPromotionRollbackResponse;
import com.exam.attendance.dto.admin.StudentResponse;
import com.exam.attendance.dto.admin.SubjectResponse;
import com.exam.attendance.dto.admin.TeacherResponse;
import com.exam.attendance.dto.admin.UpdateSubjectRequest;
import com.exam.attendance.dto.attendance.AttendanceAdjustmentRequest;
import com.exam.attendance.dto.attendance.SessionAttendanceDetailsResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceSummaryResponse;
import com.exam.attendance.dto.teacher.ScanAttendanceRequest;
import com.exam.attendance.dto.teacher.ScanAttendanceResponse;
import com.exam.attendance.service.AdminService;
import com.exam.attendance.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final DateTimeFormatter PDF_FILE_TS_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final AdminService adminService;
    private final TeacherService teacherService;

    @PostMapping("/teachers")
    public TeacherResponse createTeacher(@Valid @RequestBody CreateTeacherRequest request) {
        return adminService.createTeacher(request);
    }

    @GetMapping("/teachers")
    public List<TeacherResponse> teachers() {
        return adminService.getTeachers();
    }

    @PostMapping(value = "/teachers/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportTeachersResponse importTeachers(@RequestPart("file") MultipartFile file) {
        return adminService.importTeachers(file);
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

    @PostMapping("/students")
    public StudentResponse createStudent(@Valid @RequestBody CreateStudentRequest request) {
        return adminService.createStudent(request);
    }

    @PostMapping("/subjects")
    public SubjectResponse createSubject(@Valid @RequestBody CreateSubjectRequest request) {
        return adminService.createSubject(request);
    }

    @GetMapping("/subjects")
    public List<SubjectResponse> subjects() {
        return adminService.getSubjects();
    }

    @PostMapping(value = "/subjects/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportSubjectsResponse importSubjects(@RequestPart("file") MultipartFile file) {
        return adminService.importSubjects(file);
    }

    @GetMapping("/subjects/import/{importBatchId}/count")
    public long countSubjectsByImportBatch(@PathVariable String importBatchId) {
        return adminService.countSubjectsByImportBatch(importBatchId);
    }

    @DeleteMapping("/subjects/import/{importBatchId}")
    public DeleteSubjectsByBatchResponse removeSubjectsByImportBatch(@PathVariable String importBatchId) {
        return adminService.removeSubjectsByImportBatch(importBatchId);
    }

    @PutMapping("/subjects/{subjectId}")
    public SubjectResponse updateSubject(@PathVariable Long subjectId, @Valid @RequestBody UpdateSubjectRequest request) {
        return adminService.updateSubject(subjectId, request);
    }

    @DeleteMapping("/subjects/{subjectId}")
    public void removeSubject(@PathVariable Long subjectId) {
        adminService.removeSubject(subjectId);
    }

    @GetMapping("/students")
    public List<StudentResponse> students() {
        return adminService.getStudents();
    }

    @PostMapping("/students/promotions/preview")
    public StudentPromotionPreviewResponse previewPromotion(@Valid @RequestBody StudentPromotionPreviewRequest request) {
        return adminService.previewStudentPromotion(request);
    }

    @PostMapping("/students/promotions/execute")
    public StudentPromotionBatchDetailResponse executePromotion(@Valid @RequestBody StudentPromotionExecuteRequest request,
                                                                Authentication authentication) {
        return adminService.executeStudentPromotion(request, authentication != null ? authentication.getName() : "system");
    }

    @GetMapping("/students/promotions")
    public List<StudentPromotionBatchSummaryResponse> listPromotions() {
        return adminService.listStudentPromotionBatches();
    }

    @GetMapping("/students/promotions/{batchId}")
    public StudentPromotionBatchDetailResponse promotionBatch(@PathVariable Long batchId) {
        return adminService.getStudentPromotionBatch(batchId);
    }

    @PostMapping("/students/promotions/{batchId}/rollback")
    public StudentPromotionRollbackResponse rollbackPromotion(@PathVariable Long batchId) {
        return adminService.rollbackStudentPromotion(batchId);
    }

    @PostMapping(value = "/students/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportStudentsResponse importStudents(@RequestPart("file") MultipartFile file) {
        return adminService.importStudents(file);
    }

    @DeleteMapping("/teachers/{teacherId}")
    public void removeTeacher(@PathVariable Long teacherId) {
        adminService.removeTeacher(teacherId);
    }

    @DeleteMapping("/students/{studentId}")
    public void removeStudent(@PathVariable Long studentId) {
        adminService.removeStudent(studentId);
    }

    @GetMapping("/attendance")
    public List<AdminAttendanceResponse> attendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) String subject) {
        return adminService.getAttendance(date, teacherId, subject);
    }

    @GetMapping("/attendance/sessions")
    public List<SessionAttendanceSummaryResponse> attendanceSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) String subject) {
        return adminService.getAttendanceSessionSummaries(date, teacherId, subject);
    }

    @GetMapping("/attendance/sessions/{sessionId}")
    public SessionAttendanceDetailsResponse attendanceSessionDetails(@PathVariable Long sessionId) {
        return adminService.getAttendanceSessionDetails(sessionId);
    }

    @PostMapping("/attendance/sessions/{sessionId}/adjust")
    public SessionAttendanceDetailsResponse adjustAttendanceSession(@PathVariable Long sessionId,
                                                                    @Valid @RequestBody AttendanceAdjustmentRequest request,
                                                                    Authentication authentication) {
        String adjustedBy = authentication != null ? authentication.getName() : "admin";
        return adminService.adjustAttendanceSession(sessionId, adjustedBy, request);
    }

    @GetMapping("/attendance/report/pdf")
    public ResponseEntity<byte[]> attendancePdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) String subject) {

        byte[] data = adminService.generateAttendancePdf(date, teacherId, subject);
        String labelDate = date != null ? date.toString() : "all-dates";
        String filename = "admin-attendance-" + labelDate + "-" + LocalDateTime.now().format(PDF_FILE_TS_FORMAT) + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
