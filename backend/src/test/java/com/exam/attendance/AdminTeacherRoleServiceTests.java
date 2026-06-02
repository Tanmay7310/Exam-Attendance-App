package com.exam.attendance;

import com.exam.attendance.dto.admin.CreateTeacherRequest;
import com.exam.attendance.dto.admin.TeacherResponse;
import com.exam.attendance.dto.auth.LoginRequest;
import com.exam.attendance.dto.auth.LoginResponse;
import com.exam.attendance.entity.Role;
import com.exam.attendance.entity.Teacher;
import com.exam.attendance.entity.User;
import com.exam.attendance.exception.ApiException;
import com.exam.attendance.repository.TeacherRepository;
import com.exam.attendance.repository.UserRepository;
import com.exam.attendance.service.AdminService;
import com.exam.attendance.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AdminTeacherRoleServiceTests {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Test
    void createTeacherDefaultsToTeacherRoleWhenAdminFlagIsMissingOrFalse() {
        TeacherResponse missingFlag = adminService.createTeacher(createTeacherRequest(
                "faculty-default",
                "Default@123",
                "T-DEFAULT",
                "Default Faculty",
                null
        ));
        TeacherResponse falseFlag = adminService.createTeacher(createTeacherRequest(
                "faculty-normal",
                "Normal@123",
                "T-NORMAL",
                "Normal Faculty",
                false
        ));

        assertThat(missingFlag.getRole()).isEqualTo("TEACHER");
        assertThat(falseFlag.getRole()).isEqualTo("TEACHER");
        assertThat(userRepository.findByUsername("faculty-default").orElseThrow().getRole()).isEqualTo(Role.TEACHER);
        assertThat(login("faculty-normal", "Normal@123").getRole()).isEqualTo("TEACHER");
    }

    @Test
    void createTeacherCanGrantFullAdminRoleAndListReturnsRole() {
        TeacherResponse created = adminService.createTeacher(createTeacherRequest(
                "faculty-admin",
                "Admin@123",
                "T-ADMIN",
                "Admin Faculty",
                true
        ));

        User user = userRepository.findByUsername("faculty-admin").orElseThrow();
        LoginResponse login = login("faculty-admin", "Admin@123");

        assertThat(created.getRole()).isEqualTo("ADMIN");
        assertThat(user.getRole()).isEqualTo(Role.ADMIN);
        assertThat(login.getRole()).isEqualTo("ADMIN");
        assertThat(adminService.getTeachers())
                .filteredOn(teacher -> teacher.getUsername().equals("faculty-admin"))
                .singleElement()
                .extracting(TeacherResponse::getRole)
                .isEqualTo("ADMIN");
    }

    @Test
    void duplicateUsernameAndTeacherCodeChecksStillApply() {
        adminService.createTeacher(createTeacherRequest(
                "faculty-duplicate",
                "Pass@123",
                "T-DUP",
                "Duplicate Faculty",
                false
        ));

        assertThatThrownBy(() -> adminService.createTeacher(createTeacherRequest(
                "faculty-duplicate",
                "Pass@123",
                "T-OTHER",
                "Duplicate Username",
                true
        )))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Username already exists");

        assertThatThrownBy(() -> adminService.createTeacher(createTeacherRequest(
                "faculty-other",
                "Pass@123",
                "t-dup",
                "Duplicate Code",
                true
        )))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Teacher code already exists");
    }

    @Test
    void deleteTeacherProtectsCurrentAndLastAdminButAllowsSafeDeletes() {
        Teacher firstAdmin = teacherFor(adminService.createTeacher(createTeacherRequest(
                "admin-one",
                "AdminOne@123",
                "A-ONE",
                "Admin One",
                true
        )));
        Teacher secondAdmin = teacherFor(adminService.createTeacher(createTeacherRequest(
                "admin-two",
                "AdminTwo@123",
                "A-TWO",
                "Admin Two",
                true
        )));
        Teacher normalTeacher = teacherFor(adminService.createTeacher(createTeacherRequest(
                "faculty-delete",
                "Teacher@123",
                "T-DELETE",
                "Delete Faculty",
                false
        )));

        assertThatThrownBy(() -> adminService.removeTeacher(firstAdmin.getId(), "admin-one"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("own admin account");

        adminService.removeTeacher(normalTeacher.getId(), "admin-one");
        assertThat(teacherRepository.findById(normalTeacher.getId())).isEmpty();
        assertThat(userRepository.findByUsername("faculty-delete")).isEmpty();

        adminService.removeTeacher(secondAdmin.getId(), "admin-one");
        assertThat(teacherRepository.findById(secondAdmin.getId())).isEmpty();
        assertThat(userRepository.findByUsername("admin-two")).isEmpty();

        assertThatThrownBy(() -> adminService.removeTeacher(firstAdmin.getId(), "someone-else"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("last admin account");
    }

    private CreateTeacherRequest createTeacherRequest(String username,
                                                      String password,
                                                      String teacherCode,
                                                      String name,
                                                      Boolean admin) {
        CreateTeacherRequest request = new CreateTeacherRequest();
        request.setUsername(username);
        request.setPassword(password);
        request.setTeacherCode(teacherCode);
        request.setName(name);
        request.setSubject("N/A");
        request.setAdmin(admin);
        return request;
    }

    private LoginResponse login(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return authService.login(request);
    }

    private Teacher teacherFor(TeacherResponse response) {
        return teacherRepository.findById(response.getId()).orElseThrow();
    }
}
