package com.exam.attendance.repository;

import com.exam.attendance.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

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

    @Query("""
            select s
            from Student s
            where lower(trim(s.year)) = lower(trim(:year))
              and lower(trim(s.semester)) = lower(trim(:semester))
              and lower(trim(s.department)) = lower(trim(:department))
              and lower(trim(s.section)) = lower(trim(:section))
            """)
    List<Student> findByClassContext(@Param("year") String year,
                                     @Param("semester") String semester,
                                     @Param("department") String department,
                                     @Param("section") String section);
}
