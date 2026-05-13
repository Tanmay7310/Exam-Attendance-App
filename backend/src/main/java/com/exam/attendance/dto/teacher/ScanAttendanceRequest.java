package com.exam.attendance.dto.teacher;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScanAttendanceRequest {

    @NotBlank
    private String scholarNumber;

    private String examSubject;

    @NotBlank
    private String examYear;

    @NotBlank
    private String examSemester;

    @NotBlank
    private String examBranch;

    @NotBlank
    private String examSection;

    private Boolean caseSensitive;
}
