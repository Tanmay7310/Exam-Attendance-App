package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "attendance_session_roster_snapshots",
       uniqueConstraints = @UniqueConstraint(name = "uk_session_roster_scholar", columnNames = {"session_id", "scholar_number"}),
       indexes = {
               @Index(name = "idx_roster_session", columnList = "session_id"),
               @Index(name = "idx_roster_scholar", columnList = "scholar_number"),
               @Index(name = "idx_roster_student", columnList = "student_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSessionRosterSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "scholar_number", nullable = false, length = 50)
    private String scholarNumber;

    @Column(name = "enrollment_number", length = 50)
    private String enrollmentNumber;

    @Column(name = "student_name", nullable = false, length = 120)
    private String studentName;

    @Column(name = "exam_year", length = 20)
    private String examYear;

    @Column(name = "exam_semester", length = 20)
    private String examSemester;

    @Column(name = "exam_branch", length = 120)
    private String examBranch;

    @Column(name = "exam_section", length = 20)
    private String examSection;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;
}
