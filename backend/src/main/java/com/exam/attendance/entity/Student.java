package com.exam.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scholar_number", nullable = false, unique = true, length = 50)
    private String scholarNumber;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "enrollment_number", nullable = false, unique = true, length = 50)
    private String enrollmentNumber;

    @Column(nullable = false, length = 120)
    private String department;

    @Column(length = 20)
    private String year;

    @Column(length = 20)
    private String semester;

    @Column(nullable = false, length = 20)
    private String section;
}
