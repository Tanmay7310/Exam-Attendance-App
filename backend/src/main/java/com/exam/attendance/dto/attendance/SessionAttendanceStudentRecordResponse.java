package com.exam.attendance.dto.attendance;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SessionAttendanceStudentRecordResponse {
    private String scholarNumber;
    private String enrollmentNumber;
    private String studentName;
    private String status;
    private Instant scannedAt;
    private String teacherName;
    private String teacherCode;
}
