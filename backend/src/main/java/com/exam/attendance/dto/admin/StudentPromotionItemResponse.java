package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentPromotionItemResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String scholarNumber;
    private String enrollmentNumber;
    private String fromYear;
    private String fromSemester;
    private String fromBranch;
    private String fromSection;
    private String toYear;
    private String toSemester;
    private String toBranch;
    private String toSection;
    private String status;
    private String reason;
}

