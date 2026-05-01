package com.exam.attendance.repository;

import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findFirstByTeacherAndSessionDateOrderByCreatedAtAsc(Teacher teacher, LocalDate sessionDate);
    Optional<AttendanceSession> findByTeacherAndSessionDateAndExamSubject(Teacher teacher, LocalDate sessionDate, String examSubject);
    Optional<AttendanceSession> findByTeacherAndSessionDateAndExamSubjectIsNull(Teacher teacher, LocalDate sessionDate);
}
