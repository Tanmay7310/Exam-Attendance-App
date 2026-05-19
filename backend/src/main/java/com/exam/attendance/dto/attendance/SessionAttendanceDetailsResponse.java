package com.exam.attendance.dto.attendance;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class SessionAttendanceDetailsResponse {
    private Long sessionId;
    private LocalDate date;
    private String subject;
    private String examYear;
    private String examSemester;
    private String examBranch;
    private String examSection;
    private boolean rosterResolved;
    private int presentCount;
    private int absentCount;
    private int totalCount;
    private List<SessionAttendanceStudentRecordResponse> records;
}
