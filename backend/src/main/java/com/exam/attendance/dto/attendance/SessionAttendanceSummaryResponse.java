package com.exam.attendance.dto.attendance;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class SessionAttendanceSummaryResponse {
    private Long sessionId;
    private LocalDate date;
    private String subject;
    private String teacherName;
    private String teacherCode;
    private String examYear;
    private String examSemester;
    private String examBranch;
    private String examSection;
    private int presentCount;
    private int absentCount;
    private int totalCount;
    private boolean rosterResolved;
}
