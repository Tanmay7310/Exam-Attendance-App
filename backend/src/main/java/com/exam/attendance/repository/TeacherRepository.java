package com.exam.attendance.repository;

import com.exam.attendance.entity.Teacher;
import com.exam.attendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUser(User user);
    boolean existsByTeacherCodeIgnoreCase(String teacherCode);
}
