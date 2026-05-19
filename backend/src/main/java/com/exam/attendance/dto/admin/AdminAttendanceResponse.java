package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class AdminAttendanceResponse {
    private Long sessionId;
    private String teacherName;
    private String teacherCode;
    private String subject;
    private String scholarNumber;
    private String enrollmentNumber;
    private String studentName;
    private String examYear;
    private String examSemester;
    private String examBranch;
    private String examSection;
    private LocalDate date;
    private Instant scannedAt;
}
