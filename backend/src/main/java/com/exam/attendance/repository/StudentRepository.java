package com.exam.attendance.repository;

import com.exam.attendance.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByScholarNumber(String scholarNumber);

        @Query(value = """
                        select *
                        from students s
                        where binary trim(s.scholar_number) = binary trim(:scholarNumber)
                        limit 1
                        """, nativeQuery = true)
        Optional<Student> findByScholarNumberCaseSensitive(@Param("scholarNumber") String scholarNumber);

    @Query("""
            select case when count(s) > 0 then true else false end
            from Student s
            where lower(trim(s.scholarNumber)) = lower(trim(:scholarNumber))
            """)
    boolean existsByScholarNumberNormalized(@Param("scholarNumber") String scholarNumber);

    @Query("""
            select case when count(s) > 0 then true else false end
            from Student s
            where lower(trim(s.enrollmentNumber)) = lower(trim(:enrollmentNumber))
            """)
    boolean existsByEnrollmentNumberNormalized(@Param("enrollmentNumber") String enrollmentNumber);
}
