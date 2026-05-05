package com.exam.attendance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSubjectRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String subjectCode;

    @NotBlank
    private String branch;

    @NotBlank
    private String semester;
}
