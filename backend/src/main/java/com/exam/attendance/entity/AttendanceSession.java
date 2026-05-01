package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "attendance_sessions",
       uniqueConstraints = @UniqueConstraint(name = "uk_session_teacher_date_subject", columnNames = {"teacher_id", "session_date", "exam_subject"}))
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

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
