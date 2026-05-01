package com.exam.attendance.service;

import com.exam.attendance.dto.admin.AdminAttendanceResponse;
import com.exam.attendance.dto.admin.CreateTeacherRequest;
import com.exam.attendance.dto.admin.CreateStudentRequest;
import com.exam.attendance.dto.admin.ImportStudentsResponse;
import com.exam.attendance.dto.admin.ImportTeachersResponse;
import com.exam.attendance.dto.admin.StudentResponse;
import com.exam.attendance.dto.admin.TeacherResponse;
import com.exam.attendance.entity.AttendanceRecord;
import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.Role;
import com.exam.attendance.entity.Student;
import com.exam.attendance.entity.Teacher;
import com.exam.attendance.entity.User;
import com.exam.attendance.exception.ApiException;
import com.exam.attendance.repository.AttendanceRecordRepository;
import com.exam.attendance.repository.StudentRepository;
import com.exam.attendance.repository.TeacherRepository;
import com.exam.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final StudentRepository studentRepository;
    private final PdfService pdfService;

    @Transactional
    public TeacherResponse createTeacher(CreateTeacherRequest request) {
        userRepository.findByUsername(request.getUsername()).ifPresent(u -> {
            throw new ApiException("Username already exists");
        });
        if (teacherRepository.existsByTeacherCodeIgnoreCase(request.getTeacherCode())) {
            throw new ApiException("Teacher code already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.TEACHER)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        Teacher teacher = Teacher.builder()
                .teacherCode(request.getTeacherCode())
                .name(request.getName())
                .subject(request.getSubject())
                .user(user)
                .build();
        teacher = teacherRepository.save(teacher);

        return TeacherResponse.builder()
                .id(teacher.getId())
                .username(user.getUsername())
                .teacherCode(teacher.getTeacherCode())
                .name(teacher.getName())
                .subject(teacher.getSubject())
                .build();
    }

    public List<TeacherResponse> getTeachers() {
        return teacherRepository.findAll().stream()
                .map(teacher -> TeacherResponse.builder()
                        .id(teacher.getId())
                        .username(teacher.getUser().getUsername())
                        .teacherCode(teacher.getTeacherCode())
                        .name(teacher.getName())
                        .subject(teacher.getSubject())
                        .build())
                .toList();
    }

    @Transactional
    public StudentResponse createStudent(CreateStudentRequest request) {
        String scholarNumber = request.getScholarNumber().trim();
        String enrollmentNumber = request.getEnrollmentNumber().trim();

        if (studentRepository.existsByScholarNumberNormalized(scholarNumber)) {
            throw new ApiException("Scholar number already exists");
        }
        if (studentRepository.existsByEnrollmentNumberNormalized(enrollmentNumber)) {
            throw new ApiException("Enrollment number already exists");
        }

        Student student = Student.builder()
                .name(request.getName().trim())
                .scholarNumber(scholarNumber)
                .enrollmentNumber(enrollmentNumber)
                .department(request.getDepartment().trim())
                .semester(StringUtils.hasText(request.getSemester()) ? request.getSemester().trim() : null)
                .section(request.getSection().trim())
                .build();
        student = studentRepository.save(student);

        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .scholarNumber(student.getScholarNumber())
                .enrollmentNumber(student.getEnrollmentNumber())
                .department(student.getDepartment())
                .semester(student.getSemester())
                .section(student.getSection())
                .build();
    }

    public List<StudentResponse> getStudents() {
        return studentRepository.findAll().stream()
                .map(student -> StudentResponse.builder()
                        .id(student.getId())
                        .name(student.getName())
                        .scholarNumber(student.getScholarNumber())
                        .enrollmentNumber(student.getEnrollmentNumber())
                        .department(student.getDepartment())
                        .semester(student.getSemester())
                        .section(student.getSection())
                        .build())
                .toList();
    }

    public ImportStudentsResponse importStudents(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Please upload a non-empty file");
        }

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<CreateStudentRequest> entries;
        try {
            if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                entries = parseExcel(file);
            } else if (fileName.endsWith(".pdf")) {
                entries = parsePdf(file);
            } else {
                throw new ApiException("Unsupported file type. Please upload Excel (.xlsx/.xls) or PDF (.pdf)");
            }
        } catch (IOException e) {
            throw new ApiException("Unable to read uploaded file");
        }

        int imported = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < entries.size(); i++) {
            CreateStudentRequest row = entries.get(i);
            try {
                validateImportRow(row, i + 1);
                createStudent(row);
                imported++;
            } catch (ApiException ex) {
                errors.add("Row " + (i + 1) + ": " + ex.getMessage());
            } catch (Exception ex) {
                errors.add("Row " + (i + 1) + ": Failed to import");
            }
        }

        return ImportStudentsResponse.builder()
                .importedCount(imported)
                .skippedCount(errors.size())
                .errors(errors)
                .build();
    }

    public ImportTeachersResponse importTeachers(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Please upload a non-empty file");
        }

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<CreateTeacherRequest> entries;
        try {
            if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                entries = parseTeacherExcel(file);
            } else if (fileName.endsWith(".pdf")) {
                entries = parseTeacherPdf(file);
            } else {
                throw new ApiException("Unsupported file type. Please upload Excel (.xlsx/.xls) or PDF (.pdf)");
            }
        } catch (IOException e) {
            throw new ApiException("Unable to read uploaded file");
        }

        int imported = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < entries.size(); i++) {
            CreateTeacherRequest row = entries.get(i);
            try {
                validateTeacherImportRow(row);
                if (!StringUtils.hasText(row.getSubject())) {
                    row.setSubject("N/A");
                }
                createTeacher(row);
                imported++;
            } catch (ApiException ex) {
                errors.add("Row " + (i + 1) + ": " + ex.getMessage());
            } catch (Exception ex) {
                errors.add("Row " + (i + 1) + ": Failed to import");
            }
        }

        return ImportTeachersResponse.builder()
                .importedCount(imported)
                .skippedCount(errors.size())
                .errors(errors)
                .build();
    }

    @Transactional
    public void removeStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ApiException("Student not found"));

        if (attendanceRecordRepository.existsByStudent_Id(studentId)) {
            throw new ApiException("Cannot remove student with attendance records");
        }

        studentRepository.delete(student);
    }

    @Transactional
    public void removeTeacher(Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ApiException("Teacher not found"));

        if (!attendanceRecordRepository.findBySession_Teacher_Id(teacherId).isEmpty()) {
            throw new ApiException("Cannot remove teacher with attendance records");
        }

        Long userId = teacher.getUser().getId();
        teacherRepository.delete(teacher);
        userRepository.deleteById(userId);
    }

    public List<AdminAttendanceResponse> getAttendance(LocalDate date, String teacherId, String subject) {
        List<AttendanceRecord> all = getFilteredAttendanceRecords(date, teacherId, subject);

        return all.stream()
                .sorted((a, b) -> a.getScannedAt().compareTo(b.getScannedAt()))
                .map(this::mapAdminAttendance)
                .toList();
    }

    public byte[] generateAttendancePdf(LocalDate date, String teacherId, String subject) {
        List<AdminAttendanceResponse> rows = getAttendance(date, teacherId, subject);
        return pdfService.generateAdminAttendancePdf(date, teacherId, subject, rows);
    }

    private List<AttendanceRecord> getFilteredAttendanceRecords(LocalDate date, String teacherId, String subject) {
        List<AttendanceRecord> all = new ArrayList<>(attendanceRecordRepository.findAll());

        if (date != null) {
            all = all.stream()
                    .filter(r -> r.getSession().getSessionDate().equals(date))
                    .toList();
        }
        if (teacherId != null && !teacherId.isBlank()) {
            String teacherFilter = teacherId.trim().toLowerCase();
            all = all.stream()
                .filter(r -> {
                Teacher t = r.getSession().getTeacher();
                return String.valueOf(t.getId()).equals(teacherFilter)
                    || t.getTeacherCode().toLowerCase().contains(teacherFilter)
                    || t.getName().toLowerCase().contains(teacherFilter);
                })
                    .toList();
        }
        if (subject != null && !subject.isBlank()) {
            all = all.stream()
                    .filter(r -> resolveSessionSubject(r.getSession()).equalsIgnoreCase(subject.trim()))
                    .toList();
        }

        return all;
    }

    private AdminAttendanceResponse mapAdminAttendance(AttendanceRecord r) {
        return AdminAttendanceResponse.builder()
                .teacherName(r.getSession().getTeacher().getName())
                .teacherCode(r.getSession().getTeacher().getTeacherCode())
                .subject(resolveSessionSubject(r.getSession()))
                .scholarNumber(r.getStudent().getScholarNumber())
                .enrollmentNumber(r.getStudent().getEnrollmentNumber())
                .studentName(r.getStudent().getName())
                .date(r.getSession().getSessionDate())
                .scannedAt(r.getScannedAt())
                .build();
    }

    private String resolveSessionSubject(AttendanceSession session) {
        if (StringUtils.hasText(session.getExamSubject())) {
            return session.getExamSubject();
        }
        return session.getTeacher().getSubject();
    }

    private List<CreateStudentRequest> parseExcel(MultipartFile file) throws IOException {
        List<CreateStudentRequest> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                return rows;
            }

            Row header = sheet.getRow(0);
            if (header == null) return rows;

            Map<String, Integer> columnIndex = new HashMap<>();
            for (int i = 0; i < header.getLastCellNum(); i++) {
                String key = normalizeHeader(formatter.formatCellValue(header.getCell(i)));
                if (!key.isBlank()) {
                    columnIndex.put(key, i);
                }
            }

            Predicate<String> hasColumn = key -> columnIndex.containsKey(normalizeHeader(key));
            if (!hasColumn.test("name") || !hasColumn.test("scholarNumber") || !hasColumn.test("enrollmentNumber")
                    || !hasColumn.test("department") || !hasColumn.test("section")) {
                throw new ApiException("Excel must include headers: name, scholarNumber, enrollmentNumber, department, section");
            }

            for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null) continue;

                CreateStudentRequest request = new CreateStudentRequest();
                request.setName(getCell(row, formatter, columnIndex.get(normalizeHeader("name"))));
                request.setScholarNumber(getCell(row, formatter, columnIndex.get(normalizeHeader("scholarNumber"))));
                request.setEnrollmentNumber(getCell(row, formatter, columnIndex.get(normalizeHeader("enrollmentNumber"))));
                request.setDepartment(getCell(row, formatter, columnIndex.get(normalizeHeader("department"))));
                request.setSemester(getCell(row, formatter, columnIndex.get(normalizeHeader("semester"))));
                request.setSection(getCell(row, formatter, columnIndex.get(normalizeHeader("section"))));

                if (isAllBlank(request)) continue;
                rows.add(request);
            }
        }

        return rows;
    }

    private List<CreateStudentRequest> parsePdf(MultipartFile file) throws IOException {
        List<CreateStudentRequest> rows = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            String text = new PDFTextStripper().getText(document);
            String[] lines = text.split("\\r?\\n");

            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isBlank()) continue;
                if (line.toLowerCase().contains("name") && line.toLowerCase().contains("scholar")
                        && line.toLowerCase().contains("enrollment")) {
                    continue;
                }

                String[] parts = line.split("\\s*[,|]\\s*");
                if (parts.length < 5) continue;

                CreateStudentRequest request = new CreateStudentRequest();
                request.setName(parts[0].trim());
                request.setScholarNumber(parts[1].trim());
                request.setEnrollmentNumber(parts[2].trim());
                request.setDepartment(parts[3].trim());
                request.setSection(parts[4].trim());
                request.setSemester(parts.length > 5 ? parts[5].trim() : null);

                if (isAllBlank(request)) continue;
                rows.add(request);
            }
        }

        return rows;
    }

    private List<CreateTeacherRequest> parseTeacherExcel(MultipartFile file) throws IOException {
        List<CreateTeacherRequest> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                return rows;
            }

            Row header = sheet.getRow(0);
            if (header == null) return rows;

            Map<String, Integer> columnIndex = new HashMap<>();
            for (int i = 0; i < header.getLastCellNum(); i++) {
                String key = normalizeHeader(formatter.formatCellValue(header.getCell(i)));
                if (!key.isBlank()) {
                    columnIndex.put(key, i);
                }
            }

            Predicate<String> hasColumn = key -> columnIndex.containsKey(normalizeHeader(key));
            if (!hasColumn.test("username") || !hasColumn.test("password")
                    || !hasColumn.test("teacherCode") || !hasColumn.test("name")) {
                throw new ApiException("Excel must include headers: username, password, teacherCode, name");
            }

            for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null) continue;

                CreateTeacherRequest request = new CreateTeacherRequest();
                request.setUsername(getCell(row, formatter, columnIndex.get(normalizeHeader("username"))));
                request.setPassword(getCell(row, formatter, columnIndex.get(normalizeHeader("password"))));
                request.setTeacherCode(getCell(row, formatter, columnIndex.get(normalizeHeader("teacherCode"))));
                request.setName(getCell(row, formatter, columnIndex.get(normalizeHeader("name"))));
                request.setSubject(getCell(row, formatter, columnIndex.get(normalizeHeader("subject"))));

                if (isAllBlankTeacher(request)) continue;
                rows.add(request);
            }
        }

        return rows;
    }

    private List<CreateTeacherRequest> parseTeacherPdf(MultipartFile file) throws IOException {
        List<CreateTeacherRequest> rows = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            String text = new PDFTextStripper().getText(document);
            String[] lines = text.split("\\r?\\n");

            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isBlank()) continue;
                if (line.toLowerCase().contains("username") && line.toLowerCase().contains("teacher")) {
                    continue;
                }

                String[] parts = line.split("\\s*[,|]\\s*");
                if (parts.length < 4) continue;

                CreateTeacherRequest request = new CreateTeacherRequest();
                request.setUsername(parts[0].trim());
                request.setPassword(parts[1].trim());
                request.setTeacherCode(parts[2].trim());
                request.setName(parts[3].trim());
                request.setSubject(parts.length > 4 ? parts[4].trim() : "N/A");

                if (isAllBlankTeacher(request)) continue;
                rows.add(request);
            }
        }

        return rows;
    }

    private void validateImportRow(CreateStudentRequest request, int rowNumber) {
        if (!StringUtils.hasText(request.getName()) || !StringUtils.hasText(request.getScholarNumber())
                || !StringUtils.hasText(request.getEnrollmentNumber()) || !StringUtils.hasText(request.getDepartment())
                || !StringUtils.hasText(request.getSection())) {
            throw new ApiException("Missing required fields");
        }
    }

    private void validateTeacherImportRow(CreateTeacherRequest request) {
        if (!StringUtils.hasText(request.getUsername()) || !StringUtils.hasText(request.getPassword())
                || !StringUtils.hasText(request.getTeacherCode()) || !StringUtils.hasText(request.getName())) {
            throw new ApiException("Missing required fields");
        }
    }

    private String getCell(Row row, DataFormatter formatter, Integer index) {
        if (index == null || row.getCell(index) == null) {
            return "";
        }
        return formatter.formatCellValue(row.getCell(index)).trim();
    }

    private String normalizeHeader(String header) {
        return header == null ? "" : header.replaceAll("[^a-zA-Z]", "").toLowerCase();
    }

    private boolean isAllBlank(CreateStudentRequest request) {
        return !StringUtils.hasText(request.getName())
                && !StringUtils.hasText(request.getScholarNumber())
                && !StringUtils.hasText(request.getEnrollmentNumber())
                && !StringUtils.hasText(request.getDepartment())
                && !StringUtils.hasText(request.getSemester())
                && !StringUtils.hasText(request.getSection());
    }

    private boolean isAllBlankTeacher(CreateTeacherRequest request) {
        return !StringUtils.hasText(request.getUsername())
                && !StringUtils.hasText(request.getPassword())
                && !StringUtils.hasText(request.getTeacherCode())
                && !StringUtils.hasText(request.getName())
                && !StringUtils.hasText(request.getSubject());
    }
}
