package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentResponse {
    private Long id;
    private String name;
    private String scholarNumber;
    private String enrollmentNumber;
    private String department;
    private String year;
    private String semester;
    private String section;
}
