package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "attendance_adjustments",
       indexes = {
               @Index(name = "idx_adjustment_session_student", columnList = "session_id,student_id"),
               @Index(name = "idx_adjustment_session_time", columnList = "session_id,adjusted_at")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceAdjustmentStatus status;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(name = "adjusted_by", nullable = false, length = 80)
    private String adjustedBy;

    @Column(name = "adjusted_at", nullable = false)
    private Instant adjustedAt;
}
