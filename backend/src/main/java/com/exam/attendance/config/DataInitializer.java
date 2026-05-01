package com.exam.attendance.config;

import com.exam.attendance.entity.*;
import com.exam.attendance.repository.StudentRepository;
import com.exam.attendance.repository.TeacherRepository;
import com.exam.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin1")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);

            User teacherUser = User.builder()
                    .username("teacher1")
                    .password(passwordEncoder.encode("Teacher@123"))
                    .role(Role.TEACHER)
                    .enabled(true)
                    .build();
            teacherUser = userRepository.save(teacherUser);

            Teacher teacher = Teacher.builder()
                    .teacherCode("TCH-101")
                    .name("Dr. A. Sharma")
                    .subject("Data Structures")
                    .user(teacherUser)
                    .build();
            teacherRepository.save(teacher);
        }

        if (studentRepository.count() == 0) {
            studentRepository.saveAll(List.of(
                    Student.builder().scholarNumber("SCH001").name("Riya Verma").enrollmentNumber("ENR001").department("CSE").section("A").build(),
                    Student.builder().scholarNumber("SCH002").name("Arjun Das").enrollmentNumber("ENR002").department("CSE").section("A").build(),
                    Student.builder().scholarNumber("SCH003").name("Nisha Sen").enrollmentNumber("ENR003").department("ECE").section("B").build(),
                    Student.builder().scholarNumber("SCH004").name("Karan Iyer").enrollmentNumber("ENR004").department("ME").section("C").build()
            ));
        }
    }
}
