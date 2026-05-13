package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class StudentPromotionBatchSummaryResponse {
    private Long id;
    private String fromYear;
    private String fromSemester;
    private String fromBranch;
    private String fromSection;
    private String toYear;
    private String toSemester;
    private String toBranch;
    private String toSection;
    private String promotedBy;
    private Instant promotedAt;
    private String status;
    private int totalItems;
    private int promotedCount;
    private int skippedCount;
    private int failedCount;
    private int rolledBackCount;
    private int rollbackFailedCount;
}

