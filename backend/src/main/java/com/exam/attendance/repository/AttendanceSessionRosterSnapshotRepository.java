package com.exam.attendance.repository;

import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.AttendanceSessionRosterSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceSessionRosterSnapshotRepository extends JpaRepository<AttendanceSessionRosterSnapshot, Long> {
    boolean existsBySession(AttendanceSession session);

    boolean existsByStudent_Id(Long studentId);

    List<AttendanceSessionRosterSnapshot> findBySessionOrderByScholarNumberAsc(AttendanceSession session);
}
