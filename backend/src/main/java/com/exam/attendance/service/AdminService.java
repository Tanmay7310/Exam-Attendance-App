package com.exam.attendance.service;

import com.exam.attendance.dto.admin.AdminAttendanceResponse;
import com.exam.attendance.dto.admin.CreateTeacherRequest;
import com.exam.attendance.dto.admin.DeleteSubjectsByBatchResponse;
import com.exam.attendance.dto.admin.ImportSubjectsResponse;
import com.exam.attendance.dto.admin.CreateStudentRequest;
import com.exam.attendance.dto.admin.ImportStudentsResponse;
import com.exam.attendance.dto.admin.ImportTeachersResponse;
import com.exam.attendance.dto.admin.StudentResponse;
import com.exam.attendance.dto.admin.CreateSubjectRequest;
import com.exam.attendance.dto.admin.SubjectResponse;
import com.exam.attendance.dto.admin.TeacherResponse;
import com.exam.attendance.dto.admin.UpdateSubjectRequest;
import com.exam.attendance.entity.AttendanceRecord;
import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.Role;
import com.exam.attendance.entity.Student;
import com.exam.attendance.entity.SubjectMaster;
import com.exam.attendance.entity.Teacher;
import com.exam.attendance.entity.User;
import com.exam.attendance.exception.ApiException;
import com.exam.attendance.repository.AttendanceRecordRepository;
import com.exam.attendance.repository.StudentRepository;
import com.exam.attendance.repository.SubjectMasterRepository;
import com.exam.attendance.repository.TeacherRepository;
import com.exam.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final StudentRepository studentRepository;
    private final SubjectMasterRepository subjectMasterRepository;
    private final PdfService pdfService;
    private static final Map<String, String> BRANCH_ALIAS_MAP = buildBranchAliasMap();
    private static final Map<String, String> SEMESTER_ALIAS_MAP = buildSemesterAliasMap();

    private record ParsedSubjectRow(int rowNumber, String name, String subjectCode, String branch, String semester) {
    }

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

    @Transactional
    public SubjectResponse createSubject(CreateSubjectRequest request) {
        SubjectMaster subject = createSubjectEntity(request, null, null);
        return mapSubjectResponse(subject);
    }

    private SubjectMaster createSubjectEntity(CreateSubjectRequest request, String importBatchId, LocalDateTime importedAt) {
        String name = request.getName().trim();
        String subjectCode = request.getSubjectCode().trim();
        String branch = request.getBranch().trim();
        String semester = request.getSemester().trim();

        if (subjectMasterRepository.existsByNameIgnoreCaseAndBranchIgnoreCaseAndSemesterIgnoreCase(name, branch, semester)) {
            throw new ApiException("Subject already exists for this branch and semester");
        }
        if (subjectMasterRepository.existsBySubjectCodeIgnoreCase(subjectCode)) {
            throw new ApiException("Subject code already exists");
        }

        SubjectMaster subject = SubjectMaster.builder()
                .name(name)
                .subjectCode(subjectCode)
                .branch(branch)
                .semester(semester)
                .importBatchId(importBatchId)
                .importedAt(importedAt)
                .build();
        return subjectMasterRepository.save(subject);
    }

    public List<SubjectResponse> getSubjects() {
        return subjectMasterRepository.findAll().stream()
                .sorted((a, b) -> {
                    String branchA = StringUtils.hasText(a.getBranch()) ? a.getBranch().trim() : "";
                    String branchB = StringUtils.hasText(b.getBranch()) ? b.getBranch().trim() : "";
                    int byBranch = branchA.compareToIgnoreCase(branchB);
                    if (byBranch != 0) return byBranch;

                    String semA = StringUtils.hasText(a.getSemester()) ? a.getSemester().trim() : "";
                    String semB = StringUtils.hasText(b.getSemester()) ? b.getSemester().trim() : "";
                    int bySemester = semA.compareToIgnoreCase(semB);
                    if (bySemester != 0) return bySemester;

                    String nameA = StringUtils.hasText(a.getName()) ? a.getName().trim() : "";
                    String nameB = StringUtils.hasText(b.getName()) ? b.getName().trim() : "";
                    return nameA.compareToIgnoreCase(nameB);
                })
                .map(subject -> SubjectResponse.builder()
                        .id(subject.getId())
                        .name(StringUtils.hasText(subject.getName()) ? subject.getName().trim() : "")
                        .subjectCode(StringUtils.hasText(subject.getSubjectCode()) ? subject.getSubjectCode().trim() : "")
                        .branch(StringUtils.hasText(subject.getBranch()) ? subject.getBranch().trim() : "")
                        .semester(StringUtils.hasText(subject.getSemester()) ? subject.getSemester().trim() : "")
                        .build())
                .toList();
    }

    @Transactional
    public SubjectResponse updateSubject(Long subjectId, UpdateSubjectRequest request) {
        SubjectMaster subject = subjectMasterRepository.findById(subjectId)
                .orElseThrow(() -> new ApiException("Subject not found"));

        String name = request.getName().trim();
        String subjectCode = request.getSubjectCode().trim();
        String branch = subject.getBranch().trim();
        String semester = subject.getSemester().trim();

        if (subjectMasterRepository.existsByNameIgnoreCaseAndBranchIgnoreCaseAndSemesterIgnoreCaseAndIdNot(name, branch, semester, subjectId)) {
            throw new ApiException("Subject already exists for this branch and semester");
        }
        if (subjectMasterRepository.existsBySubjectCodeIgnoreCaseAndIdNot(subjectCode, subjectId)) {
            throw new ApiException("Subject code already exists");
        }

        subject.setName(name);
        subject.setSubjectCode(subjectCode);
        subject = subjectMasterRepository.save(subject);

        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .subjectCode(subject.getSubjectCode())
                .branch(subject.getBranch())
                .semester(subject.getSemester())
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

    public ImportSubjectsResponse importSubjects(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("Please upload a non-empty file");
        }

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<ParsedSubjectRow> entries;
        try {
            if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                entries = parseSubjectExcel(file);
            } else if (fileName.endsWith(".docx")) {
                entries = parseSubjectDocx(file);
            } else {
                throw new ApiException("Unsupported file type. Please upload Excel (.xlsx/.xls) or Word (.docx)");
            }
        } catch (IOException e) {
            throw new ApiException("Unable to read uploaded file");
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Unable to parse uploaded subject file: " + e.getClass().getSimpleName());
        }

        if (entries.isEmpty()) {
            throw new ApiException("No importable subject rows found in uploaded file");
        }

        String importBatchId = "SBJ-" + LocalDateTime.now().toString().replaceAll("[^0-9]", "") + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        LocalDateTime importedAt = LocalDateTime.now();
        int imported = 0;
        List<String> errors = new ArrayList<>();

        for (ParsedSubjectRow row : entries) {
            try {
                CreateSubjectRequest request = normalizeSubjectImportRow(row);
                createSubjectEntity(request, importBatchId, importedAt);
                imported++;
            } catch (ApiException ex) {
                errors.add("Row " + row.rowNumber() + ": " + ex.getMessage());
            } catch (Exception ex) {
                errors.add("Row " + row.rowNumber() + ": Failed to import");
            }
        }

        return ImportSubjectsResponse.builder()
                .importedCount(imported)
                .skippedCount(errors.size())
                .errors(errors)
                .importBatchId(importBatchId)
                .build();
    }

    public long countSubjectsByImportBatch(String importBatchId) {
        String batch = importBatchId == null ? "" : importBatchId.trim();
        if (!StringUtils.hasText(batch)) {
            throw new ApiException("Import batch ID is required");
        }
        return subjectMasterRepository.countByImportBatchId(batch);
    }

    @Transactional
    public DeleteSubjectsByBatchResponse removeSubjectsByImportBatch(String importBatchId) {
        String batch = importBatchId == null ? "" : importBatchId.trim();
        if (!StringUtils.hasText(batch)) {
            throw new ApiException("Import batch ID is required");
        }

        List<SubjectMaster> subjects = subjectMasterRepository.findByImportBatchId(batch);
        List<String> errors = new ArrayList<>();
        int deleted = 0;

        for (SubjectMaster subject : subjects) {
            try {
                removeSubject(subject.getId());
                deleted++;
            } catch (ApiException ex) {
                errors.add("Subject ID " + subject.getId() + ": " + ex.getMessage());
            } catch (Exception ex) {
                errors.add("Subject ID " + subject.getId() + ": Failed to delete");
            }
        }

        return DeleteSubjectsByBatchResponse.builder()
                .importBatchId(batch)
                .attempted(subjects.size())
                .deleted(deleted)
                .failed(errors.size())
                .errors(errors)
                .build();
    }

    @Transactional
    public void removeSubject(Long subjectId) {
        SubjectMaster subject = subjectMasterRepository.findById(subjectId)
                .orElseThrow(() -> new ApiException("Subject not found"));
        try {
            subjectMasterRepository.delete(subject);
            subjectMasterRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException("Cannot delete subject because it is linked to existing records");
        }
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

    private SubjectResponse mapSubjectResponse(SubjectMaster subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .subjectCode(subject.getSubjectCode())
                .branch(subject.getBranch())
                .semester(subject.getSemester())
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

    private List<ParsedSubjectRow> parseSubjectExcel(MultipartFile file) throws IOException {
        List<ParsedSubjectRow> rows = new ArrayList<>();
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
            if (!hasColumn.test("name") || !hasColumn.test("subjectCode")
                    || !hasColumn.test("branch") || !hasColumn.test("semester")) {
                throw new ApiException("Excel must include headers: name, subjectCode, branch, semester");
            }

            for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null) continue;

                String name = getCell(row, formatter, columnIndex.get(normalizeHeader("name")));
                String subjectCode = getCell(row, formatter, columnIndex.get(normalizeHeader("subjectCode")));
                String branch = getCell(row, formatter, columnIndex.get(normalizeHeader("branch")));
                String semester = getCell(row, formatter, columnIndex.get(normalizeHeader("semester")));

                if (!StringUtils.hasText(name) && !StringUtils.hasText(subjectCode)
                        && !StringUtils.hasText(branch) && !StringUtils.hasText(semester)) {
                    continue;
                }
                rows.add(new ParsedSubjectRow(rowNum + 1, name, subjectCode, branch, semester));
            }
        }

        return rows;
    }

    private List<ParsedSubjectRow> parseSubjectDocx(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
            List<ParsedSubjectRow> tableRows = parseSubjectDocxTables(document);
            if (!tableRows.isEmpty()) {
                return tableRows;
            }
            return parseSubjectDocxText(document);
        }
    }

    private List<ParsedSubjectRow> parseSubjectDocxTables(XWPFDocument document) {
        List<ParsedSubjectRow> rows = new ArrayList<>();
        int rowCounter = 1;

        for (XWPFTable table : document.getTables()) {
            for (XWPFTableRow tableRow : table.getRows()) {
                List<String> values = new ArrayList<>();
                for (XWPFTableCell cell : tableRow.getTableCells()) {
                    values.add(cleanDocxValue(cell.getText()));
                }

                rowCounter++;
                if (values.stream().allMatch(v -> !StringUtils.hasText(v))) {
                    continue;
                }
                if (isSubjectHeaderRow(values)) {
                    continue;
                }

                List<String> filtered = values.stream().filter(StringUtils::hasText).toList();
                if (filtered.size() < 4) {
                    continue;
                }
                if (filtered.size() >= 5 && filtered.get(0).matches("^\\d+[.)-]?$")) {
                    filtered = filtered.subList(1, filtered.size());
                }

                String col0 = filtered.get(0);
                String col1 = filtered.get(1);
                String col2 = filtered.get(2);
                String col3 = filtered.get(3);

                String name;
                String subjectCode;
                if (looksLikeSubjectCode(col0) && !looksLikeSubjectCode(col1)) {
                    subjectCode = col0;
                    name = col1;
                } else {
                    name = col0;
                    subjectCode = col1;
                }

                rows.add(new ParsedSubjectRow(rowCounter, name, subjectCode, col2, col3));
            }
        }

        return rows;
    }

    private List<ParsedSubjectRow> parseSubjectDocxText(XWPFDocument document) {
        List<ParsedSubjectRow> rows = new ArrayList<>();
        int rowCounter = 1;

        for (XWPFParagraph paragraph : document.getParagraphs()) {
            String line = cleanDocxValue(paragraph.getText());
            rowCounter++;
            if (!StringUtils.hasText(line)) continue;

            String lower = line.toLowerCase();
            if ((lower.contains("subject") && lower.contains("code") && lower.contains("semester"))
                    || lower.contains("branch")) {
                continue;
            }

            String[] split = line.split("\\s*[,|]\\s*");
            List<String> parts = Arrays.stream(split)
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .toList();
            if (parts.size() < 4) {
                continue;
            }

            int startIndex = parts.get(0).matches("^\\d+[.)-]?$") ? 1 : 0;
            if (parts.size() - startIndex < 4) {
                continue;
            }

            String col0 = parts.get(startIndex);
            String col1 = parts.get(startIndex + 1);
            String col2 = parts.get(startIndex + 2);
            String col3 = parts.get(startIndex + 3);

            String name;
            String subjectCode;
            if (looksLikeSubjectCode(col0) && !looksLikeSubjectCode(col1)) {
                subjectCode = col0;
                name = col1;
            } else {
                name = col0;
                subjectCode = col1;
            }

            rows.add(new ParsedSubjectRow(rowCounter, name, subjectCode, col2, col3));
        }

        return rows;
    }

    private CreateSubjectRequest normalizeSubjectImportRow(ParsedSubjectRow row) {
        String name = StringUtils.hasText(row.name()) ? row.name().trim() : "";
        String subjectCode = normalizeSubjectCode(row.subjectCode());
        String branch = StringUtils.hasText(row.branch()) ? row.branch().trim() : "";
        String semester = StringUtils.hasText(row.semester()) ? row.semester().trim() : "";

        if (!StringUtils.hasText(name) || !StringUtils.hasText(subjectCode)
                || !StringUtils.hasText(branch) || !StringUtils.hasText(semester)) {
            throw new ApiException("Missing required fields (name, subjectCode, branch, semester)");
        }
        if (!isValidSubjectCode(subjectCode)) {
            throw new ApiException("Malformed subject code: " + row.subjectCode());
        }

        String normalizedBranch = normalizeBranchAlias(branch);
        String normalizedSemester = normalizeSemesterAlias(semester);

        CreateSubjectRequest request = new CreateSubjectRequest();
        request.setName(name);
        request.setSubjectCode(subjectCode);
        request.setBranch(normalizedBranch);
        request.setSemester(normalizedSemester);
        return request;
    }

    private String normalizeBranchAlias(String value) {
        String key = normalizeAliasKey(value);
        String normalized = BRANCH_ALIAS_MAP.get(key);
        if (!StringUtils.hasText(normalized)) {
            throw new ApiException("Unknown branch alias: " + value);
        }
        return normalized;
    }

    private String normalizeSemesterAlias(String value) {
        String key = normalizeAliasKey(value);
        String normalized = SEMESTER_ALIAS_MAP.get(key);
        if (!StringUtils.hasText(normalized)) {
            throw new ApiException("Unknown semester alias: " + value);
        }
        return normalized;
    }

    private boolean isSubjectHeaderRow(List<String> values) {
        String combined = values.stream()
                .filter(StringUtils::hasText)
                .map(v -> v.trim().toLowerCase())
                .reduce("", (a, b) -> a + " " + b)
                .trim();
        return combined.contains("subject")
                && (combined.contains("code") || combined.contains("name"))
                && (combined.contains("branch") || combined.contains("semester"));
    }

    private boolean looksLikeSubjectCode(String value) {
        if (!StringUtils.hasText(value)) return false;
        String v = normalizeSubjectCode(value);
        return v.matches("(?i).*[a-z].*\\d.*") || v.matches("(?i).*[a-z].*[-_].*");
    }

    private String normalizeSubjectCode(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        String normalized = value.trim().toUpperCase();
        normalized = normalized.replaceAll("\\s*[-]\\s*", "-");
        normalized = normalized.replaceAll("\\s*\\(\\s*", "(");
        normalized = normalized.replaceAll("\\s*\\)\\s*", ")");
        normalized = normalized.replaceAll("([A-Z]{2,4})\\s+(\\d{3}(?:\\([A-Z]\\))?)", "$1-$2");
        normalized = normalized.replaceAll("\\s+", " ");
        return normalized.trim();
    }

    private boolean isValidSubjectCode(String subjectCode) {
        if (!StringUtils.hasText(subjectCode)) {
            return false;
        }
        String code = subjectCode.trim();
        return code.matches("^[A-Z]{2,4}-\\d{3}(\\([A-Z]\\))?$");
    }

    private String cleanDocxValue(String value) {
        return value == null ? "" : value.replace('\n', ' ').replace('\r', ' ').trim();
    }

    private static Map<String, String> buildBranchAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();

        addBranchAlias(aliases, "Mechanical Engineering", "mechanical engineering", "mechanical", "me", "mech", "mechanicalengg");
        addBranchAlias(aliases, "Civil Engineering", "civil engineering", "civil", "ce", "civilengg");
        addBranchAlias(aliases, "Computer Science and Engineering", "computer science and engineering", "computer science engineering", "computerscienceengineering", "computer science", "cs", "cse");
        addBranchAlias(aliases, "Information Technology", "information technology", "informationtechnology", "it");
        addBranchAlias(aliases, "Electronics and Communication Engineering", "electronics and communication engineering", "electronics communication engineering", "electronicscommunicationengineering", "electronics and communication", "ece", "ec");

        return aliases;
    }

    private static Map<String, String> buildSemesterAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addSemesterAlias(aliases, "1", "1", "1st", "sem1", "semester1", "s1", "i", "first");
        addSemesterAlias(aliases, "2", "2", "2nd", "sem2", "semester2", "s2", "ii", "second");
        addSemesterAlias(aliases, "3", "3", "3rd", "sem3", "semester3", "s3", "iii", "third");
        addSemesterAlias(aliases, "4", "4", "4th", "sem4", "semester4", "s4", "iv", "fourth");
        addSemesterAlias(aliases, "5", "5", "5th", "sem5", "semester5", "s5", "v", "fifth");
        addSemesterAlias(aliases, "6", "6", "6th", "sem6", "semester6", "s6", "vi", "sixth");
        addSemesterAlias(aliases, "7", "7", "7th", "sem7", "semester7", "s7", "vii", "seventh");
        addSemesterAlias(aliases, "8", "8", "8th", "sem8", "semester8", "s8", "viii", "eighth");
        return aliases;
    }

    private static void addBranchAlias(Map<String, String> aliases, String canonical, String... options) {
        for (String option : options) {
            aliases.put(normalizeAliasKey(option), canonical);
        }
        aliases.put(normalizeAliasKey(canonical), canonical);
    }

    private static void addSemesterAlias(Map<String, String> aliases, String canonical, String... options) {
        for (String option : options) {
            aliases.put(normalizeAliasKey(option), canonical);
        }
        aliases.put(normalizeAliasKey(canonical), canonical);
    }

    private static String normalizeAliasKey(String value) {
        return value == null ? "" : value.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
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
