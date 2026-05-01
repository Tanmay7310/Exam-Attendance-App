package com.exam.attendance.dto.teacher;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScanAttendanceRequest {

    @NotBlank
    private String scholarNumber;

    private String examSubject;

    private Boolean caseSensitive;
}
