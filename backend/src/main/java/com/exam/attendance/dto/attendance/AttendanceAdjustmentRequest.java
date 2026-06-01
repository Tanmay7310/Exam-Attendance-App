package com.exam.attendance.dto.attendance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AttendanceAdjustmentRequest {

    @NotBlank
    private String scholarNumber;

    @NotBlank
    @Pattern(regexp = "PRESENT|ABSENT", flags = Pattern.Flag.CASE_INSENSITIVE, message = "Status must be PRESENT or ABSENT")
    private String status;

    @NotBlank
    @Size(max = 255)
    private String reason;
}
