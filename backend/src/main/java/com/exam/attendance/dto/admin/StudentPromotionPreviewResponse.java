package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StudentPromotionPreviewResponse {
    private PromotionClassContext from;
    private int candidateCount;
    private List<StudentPromotionCandidateResponse> candidates;
}

