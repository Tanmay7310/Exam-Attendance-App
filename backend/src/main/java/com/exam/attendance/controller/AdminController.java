package com.exam.attendance.controller;

import com.exam.attendance.dto.admin.AdminAttendanceResponse;
import com.exam.attendance.dto.admin.CreateStudentRequest;
import com.exam.attendance.dto.admin.CreateSubjectRequest;
import com.exam.attendance.dto.admin.CreateTeacherRequest;
import com.exam.attendance.dto.admin.ImportStudentsResponse;
import com.exam.attendance.dto.admin.ImportTeachersResponse;
import com.exam.attendance.dto.admin.StudentResponse;
import com.exam.attendance.dto.admin.SubjectResponse;
import com.exam.attendance.dto.admin.TeacherResponse;
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

    @GetMapping("/students")
    public List<StudentResponse> students() {
        return adminService.getStudents();
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
