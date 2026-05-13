package com.exam.attendance.repository;

import com.exam.attendance.entity.PromotionItemStatus;
import com.exam.attendance.entity.StudentPromotionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentPromotionItemRepository extends JpaRepository<StudentPromotionItem, Long> {
    List<StudentPromotionItem> findByBatch_IdOrderByIdAsc(Long batchId);
    long countByBatch_IdAndStatus(Long batchId, PromotionItemStatus status);
}

