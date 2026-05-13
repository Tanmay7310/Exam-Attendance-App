package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StudentPromotionRollbackResponse {
    private Long batchId;
    private int attempted;
    private int rolledBack;
    private int failed;
    private List<String> errors;
    private String status;
}

