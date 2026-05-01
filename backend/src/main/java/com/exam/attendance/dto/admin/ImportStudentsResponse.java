package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ImportStudentsResponse {
    private int importedCount;
    private int skippedCount;
    private List<String> errors;
}
