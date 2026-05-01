package com.exam.attendance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateStudentRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String scholarNumber;

    @NotBlank
    private String enrollmentNumber;

    @NotBlank
    private String department;

    private String semester;

    @NotBlank
    private String section;
}
