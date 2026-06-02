package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeacherResponse {
    private Long id;
    private String username;
    private String teacherCode;
    private String name;
    private String subject;
    private String role;
}
