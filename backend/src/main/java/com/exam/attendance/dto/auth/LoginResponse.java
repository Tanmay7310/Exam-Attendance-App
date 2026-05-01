package com.exam.attendance.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String role;
    private String username;
    private String teacherName;
    private String subject;
    private String teacherCode;
}
