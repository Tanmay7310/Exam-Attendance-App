package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StudentPromotionBatchDetailResponse {
    private StudentPromotionBatchSummaryResponse batch;
    private List<StudentPromotionItemResponse> items;
}

