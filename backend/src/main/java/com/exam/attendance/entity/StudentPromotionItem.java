package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_promotion_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPromotionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private StudentPromotionBatch batch;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PromotionItemStatus status;

    @Column(length = 255)
    private String reason;
}

