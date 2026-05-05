package com.exam.attendance.repository;

import com.exam.attendance.entity.SubjectMaster;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectMasterRepository extends JpaRepository<SubjectMaster, Long> {
    boolean existsByNameIgnoreCaseAndBranchIgnoreCaseAndSemesterIgnoreCase(String name, String branch, String semester);
    boolean existsBySubjectCodeIgnoreCase(String subjectCode);
}
