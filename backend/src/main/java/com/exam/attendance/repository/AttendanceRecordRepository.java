package com.exam.attendance.repository;

import com.exam.attendance.entity.AttendanceRecord;
import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    boolean existsBySessionAndStudent(AttendanceSession session, Student student);

    boolean existsByStudent_Id(Long studentId);

    List<AttendanceRecord> findBySessionOrderByScannedAtAsc(AttendanceSession session);

    List<AttendanceRecord> findBySessionOrderByStudent_ScholarNumberAsc(AttendanceSession session);

    List<AttendanceRecord> findBySession_SessionDate(LocalDate date);

    List<AttendanceRecord> findBySession_Teacher_Id(Long teacherId);

    List<AttendanceRecord> findBySession_Teacher_SubjectIgnoreCase(String subject);

    List<AttendanceRecord> findByScannedAtBetween(Instant start, Instant end);
}
