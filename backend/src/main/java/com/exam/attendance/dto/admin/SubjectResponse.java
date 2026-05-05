package com.exam.attendance.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubjectResponse {
    Long id;
    String name;
    String subjectCode;
    String branch;
    String semester;
}
