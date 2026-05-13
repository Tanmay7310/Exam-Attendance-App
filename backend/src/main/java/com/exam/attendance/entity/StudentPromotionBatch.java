package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "student_promotion_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPromotionBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_year", nullable = false, length = 20)
    private String fromYear;

    @Column(name = "from_semester", nullable = false, length = 20)
    private String fromSemester;

    @Column(name = "from_branch", nullable = false, length = 120)
    private String fromBranch;

    @Column(name = "from_section", nullable = false, length = 20)
    private String fromSection;

    @Column(name = "to_year", nullable = false, length = 20)
    private String toYear;

    @Column(name = "to_semester", nullable = false, length = 20)
    private String toSemester;

    @Column(name = "to_branch", nullable = false, length = 120)
    private String toBranch;

    @Column(name = "to_section", nullable = false, length = 20)
    private String toSection;

    @Column(name = "promoted_by", nullable = false, length = 80)
    private String promotedBy;

    @Column(name = "promoted_at", nullable = false)
    private Instant promotedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PromotionBatchStatus status;
}

