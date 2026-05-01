package com.exam.attendance.service;

import com.exam.attendance.dto.auth.LoginRequest;
import com.exam.attendance.dto.auth.LoginResponse;
import com.exam.attendance.entity.Teacher;
import com.exam.attendance.entity.User;
import com.exam.attendance.repository.TeacherRepository;
import com.exam.attendance.repository.UserRepository;
import com.exam.attendance.security.AppUserPrincipal;
import com.exam.attendance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByUsername(principal.getUsername()).orElseThrow();
        String token = jwtService.generateToken(principal);

        if (user.getRole().name().equals("TEACHER")) {
            Teacher teacher = teacherRepository.findByUser(user).orElseThrow();
            return LoginResponse.builder()
                    .token(token)
                    .role(user.getRole().name())
                    .username(user.getUsername())
                    .teacherName(teacher.getName())
                    .subject(teacher.getSubject())
                    .teacherCode(teacher.getTeacherCode())
                    .build();
        }

        return LoginResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .username(user.getUsername())
                .build();
    }
}
