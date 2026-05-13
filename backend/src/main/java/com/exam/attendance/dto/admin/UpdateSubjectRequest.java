package com.exam.attendance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateSubjectRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String subjectCode;
}

