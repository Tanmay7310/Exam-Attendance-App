package com.exam.attendance.repository;

import com.exam.attendance.entity.AttendanceAdjustment;
import com.exam.attendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceAdjustmentRepository extends JpaRepository<AttendanceAdjustment, Long> {
    List<AttendanceAdjustment> findBySessionOrderByAdjustedAtAscIdAsc(AttendanceSession session);
}
