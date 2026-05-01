package com.exam.attendance.dto.teacher;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ScanAttendanceResponse {
    private String scholarNumber;
    private String studentName;
    private Instant scannedAt;
    private boolean duplicate;
    private String message;
}
