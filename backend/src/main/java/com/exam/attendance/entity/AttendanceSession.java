package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "attendance_sessions",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_session_teacher_date_subject_class",
               columnNames = {"teacher_id", "session_date", "exam_subject", "exam_year", "exam_semester", "exam_branch", "exam_section"}
       ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "exam_subject")
    private String examSubject;

    @Column(name = "exam_year")
    private String examYear;

    @Column(name = "exam_semester")
    private String examSemester;

    @Column(name = "exam_branch")
    private String examBranch;

    @Column(name = "exam_section")
    private String examSection;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
