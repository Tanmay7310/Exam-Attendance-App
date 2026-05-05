package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "subjects",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_subject_name_branch_semester", columnNames = {"name", "branch", "semester"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "subject_code", nullable = false, unique = true, length = 50)
    private String subjectCode;

    @Column(nullable = false, length = 80)
    private String branch;

    @Column(nullable = false, length = 20)
    private String semester;
}
