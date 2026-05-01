package com.exam.attendance.dto.teacher;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeacherProfileResponse {
    private String teacherCode;
    private String name;
    private String subject;
}
