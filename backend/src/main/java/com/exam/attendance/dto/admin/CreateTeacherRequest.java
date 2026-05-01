package com.exam.attendance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTeacherRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String teacherCode;

    @NotBlank
    private String name;

    @NotBlank
    private String subject;
}
