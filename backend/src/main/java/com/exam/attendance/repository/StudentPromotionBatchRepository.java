package com.exam.attendance.repository;

import com.exam.attendance.entity.StudentPromotionBatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentPromotionBatchRepository extends JpaRepository<StudentPromotionBatch, Long> {
}

