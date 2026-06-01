package com.exam.attendance.repository;

import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByTeacherAndSessionDate(Teacher teacher, LocalDate sessionDate);
    List<AttendanceSession> findByTeacherOrderBySessionDateDescCreatedAtDesc(Teacher teacher);
    Optional<AttendanceSession> findFirstByTeacherAndSessionDateOrderByCreatedAtAsc(Teacher teacher, LocalDate sessionDate);
    Optional<AttendanceSession> findByTeacherAndSessionDateAndExamSubjectAndExamYearAndExamSemesterAndExamBranchAndExamSection(
            Teacher teacher,
            LocalDate sessionDate,
            String examSubject,
            String examYear,
            String examSemester,
            String examBranch,
            String examSection
    );

    Optional<AttendanceSession> findByTeacherAndSessionDateAndExamSubjectIsNullAndExamYearAndExamSemesterAndExamBranchAndExamSection(
            Teacher teacher,
            LocalDate sessionDate,
            String examYear,
            String examSemester,
            String examBranch,
            String examSection
    );
}
