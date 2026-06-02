package com.exam.attendance.repository;

import com.exam.attendance.entity.User;
import com.exam.attendance.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    long countByRoleAndEnabledTrue(Role role);
}
