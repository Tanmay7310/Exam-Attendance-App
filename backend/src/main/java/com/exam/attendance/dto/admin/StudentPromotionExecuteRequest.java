package com.exam.attendance.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class StudentPromotionExecuteRequest {
    @Valid
    @NotNull
    private PromotionClassContext from;

    @Valid
    @NotNull
    private PromotionClassContext to;

    @NotEmpty
    private List<Long> studentIds;
}

