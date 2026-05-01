package com.exam.attendance.dto.teacher;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class AttendanceRecordResponse {
    private String scholarNumber;
    private String enrollmentNumber;
    private String studentName;
    private Instant scannedAt;
    private LocalDate date;
    private String subject;
}
