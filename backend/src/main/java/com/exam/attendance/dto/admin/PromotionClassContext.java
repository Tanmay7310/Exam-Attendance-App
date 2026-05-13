package com.exam.attendance.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PromotionClassContext {
    @NotBlank
    private String year;

    @NotBlank
    private String semester;

    @NotBlank
    private String branch;

    @NotBlank
    private String section;
}

