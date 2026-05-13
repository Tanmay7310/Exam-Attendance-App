package com.exam.attendance.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StudentPromotionPreviewRequest {
    @Valid
    @NotNull
    private PromotionClassContext from;
}

