package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DeleteSubjectsByBatchResponse {
    private String importBatchId;
    private int attempted;
    private int deleted;
    private int failed;
    private List<String> errors;
}

