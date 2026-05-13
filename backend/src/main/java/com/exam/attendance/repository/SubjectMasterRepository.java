package com.exam.attendance.repository;

import com.exam.attendance.entity.SubjectMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectMasterRepository extends JpaRepository<SubjectMaster, Long> {
    boolean existsByNameIgnoreCaseAndBranchIgnoreCaseAndSemesterIgnoreCase(String name, String branch, String semester);
    boolean existsByNameIgnoreCaseAndBranchIgnoreCaseAndSemesterIgnoreCaseAndIdNot(String name, String branch, String semester, Long id);
    boolean existsBySubjectCodeIgnoreCase(String subjectCode);
    boolean existsBySubjectCodeIgnoreCaseAndIdNot(String subjectCode, Long id);
    List<SubjectMaster> findByImportBatchId(String importBatchId);
    long countByImportBatchId(String importBatchId);
}
