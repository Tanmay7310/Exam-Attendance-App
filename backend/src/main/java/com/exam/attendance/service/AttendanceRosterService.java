package com.exam.attendance.service;

import com.exam.attendance.entity.AttendanceSession;
import com.exam.attendance.entity.AttendanceSessionRosterSnapshot;
import com.exam.attendance.entity.Student;
import com.exam.attendance.repository.AttendanceSessionRosterSnapshotRepository;
import com.exam.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceRosterService {
    private static final Map<String, String> BRANCH_ALIAS_MAP = buildBranchAliasMap();
    private static final Map<String, String> YEAR_ALIAS_MAP = buildYearAliasMap();
    private static final Map<String, String> SEMESTER_ALIAS_MAP = buildSemesterAliasMap();

    private final StudentRepository studentRepository;
    private final AttendanceSessionRosterSnapshotRepository rosterSnapshotRepository;

    public record RosterResolution(boolean rosterResolved, List<AttendanceSessionRosterSnapshot> snapshots) {}

    @Transactional
    public void ensureRosterSnapshot(AttendanceSession session) {
        if (!hasClassSnapshot(session) || rosterSnapshotRepository.existsBySession(session)) {
            return;
        }
        List<Student> students = resolveEligibleStudents(session);
        if (students.isEmpty()) {
            return;
        }
        try {
            rosterSnapshotRepository.saveAll(students.stream()
                    .map(student -> toSnapshot(session, student))
                    .toList());
        } catch (DataIntegrityViolationException ignored) {
            // Another request may have created the same session roster concurrently.
        }
    }

    @Transactional
    public RosterResolution resolveRoster(AttendanceSession session) {
        List<AttendanceSessionRosterSnapshot> existing = rosterSnapshotRepository.findBySessionOrderByScholarNumberAsc(session);
        if (!existing.isEmpty()) {
            return new RosterResolution(true, existing);
        }
        if (!hasClassSnapshot(session)) {
            return new RosterResolution(false, List.of());
        }

        List<Student> students = resolveEligibleStudents(session);
        if (students.isEmpty()) {
            return new RosterResolution(false, List.of());
        }

        try {
            rosterSnapshotRepository.saveAll(students.stream()
                    .map(student -> toSnapshot(session, student))
                    .toList());
        } catch (DataIntegrityViolationException ignored) {
            // Re-read below; unique constraints keep the snapshot deterministic.
        }

        List<AttendanceSessionRosterSnapshot> snapshots = rosterSnapshotRepository.findBySessionOrderByScholarNumberAsc(session);
        return new RosterResolution(!snapshots.isEmpty(), snapshots);
    }

    public boolean hasRosterForStudent(Long studentId) {
        return rosterSnapshotRepository.existsByStudent_Id(studentId);
    }

    public boolean hasClassSnapshot(AttendanceSession session) {
        return StringUtils.hasText(session.getExamYear())
                && StringUtils.hasText(session.getExamSemester())
                && StringUtils.hasText(session.getExamBranch())
                && StringUtils.hasText(session.getExamSection());
    }

    private AttendanceSessionRosterSnapshot toSnapshot(AttendanceSession session, Student student) {
        return AttendanceSessionRosterSnapshot.builder()
                .session(session)
                .student(student)
                .scholarNumber(safe(student.getScholarNumber()))
                .enrollmentNumber(safe(student.getEnrollmentNumber()))
                .studentName(safe(student.getName()))
                .examYear(session.getExamYear())
                .examSemester(session.getExamSemester())
                .examBranch(session.getExamBranch())
                .examSection(session.getExamSection())
                .capturedAt(Instant.now())
                .build();
    }

    private List<Student> resolveEligibleStudents(AttendanceSession session) {
        String sessionYear = normalizeYear(session.getExamYear());
        String sessionSemester = normalizeSemester(session.getExamSemester());
        String sessionBranch = normalizeBranch(session.getExamBranch());
        String sessionSection = normalizeSection(session.getExamSection());

        if (!StringUtils.hasText(sessionYear)
                || !StringUtils.hasText(sessionSemester)
                || !StringUtils.hasText(sessionBranch)
                || !StringUtils.hasText(sessionSection)) {
            return List.of();
        }

        return studentRepository.findAll().stream()
                .filter(student -> StringUtils.hasText(student.getYear())
                        && StringUtils.hasText(student.getSemester())
                        && StringUtils.hasText(student.getDepartment())
                        && StringUtils.hasText(student.getSection()))
                .filter(student -> normalizeYear(student.getYear()).equals(sessionYear)
                        && normalizeSemester(student.getSemester()).equals(sessionSemester)
                        && normalizeBranch(student.getDepartment()).equals(sessionBranch)
                        && normalizeSection(student.getSection()).equals(sessionSection))
                .sorted(Comparator.comparing(student -> safe(student.getScholarNumber()).toLowerCase()))
                .toList();
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeBranch(String value) {
        String key = normalizeAliasKey(value);
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return BRANCH_ALIAS_MAP.getOrDefault(key, key);
    }

    private String normalizeYear(String value) {
        String key = normalizeAliasKey(value);
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return YEAR_ALIAS_MAP.getOrDefault(key, key);
    }

    private String normalizeSemester(String value) {
        String key = normalizeAliasKey(value);
        if (!StringUtils.hasText(key)) {
            return "";
        }
        return SEMESTER_ALIAS_MAP.getOrDefault(key, key);
    }

    private String normalizeSection(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim().toLowerCase();
    }

    private static Map<String, String> buildBranchAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addAlias(aliases, "computerscienceandengineering", "cse", "cs", "computerscienceengineering", "computerscience");
        addAlias(aliases, "informationtechnology", "it");
        addAlias(aliases, "electronicsandcommunicationengineering", "ece", "ec", "electronicscommunicationengineering", "electronicsandcommunication");
        addAlias(aliases, "civilengineering", "ce", "civil");
        addAlias(aliases, "mechanicalengineering", "me", "mech", "mechanical");
        addAlias(aliases, "csit");
        addAlias(aliases, "aiml");
        addAlias(aliases, "ds");
        addAlias(aliases, "cybersecurity", "cyber");
        addAlias(aliases, "iot");
        return aliases;
    }

    private static Map<String, String> buildYearAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addAlias(aliases, "1", "1st", "first", "year1", "y1");
        addAlias(aliases, "2", "2nd", "second", "year2", "y2");
        addAlias(aliases, "3", "3rd", "third", "year3", "y3");
        addAlias(aliases, "4", "4th", "fourth", "year4", "y4");
        return aliases;
    }

    private static Map<String, String> buildSemesterAliasMap() {
        Map<String, String> aliases = new LinkedHashMap<>();
        addAlias(aliases, "1", "1st", "sem1", "semester1", "s1", "i", "first");
        addAlias(aliases, "2", "2nd", "sem2", "semester2", "s2", "ii", "second");
        addAlias(aliases, "3", "3rd", "sem3", "semester3", "s3", "iii", "third");
        addAlias(aliases, "4", "4th", "sem4", "semester4", "s4", "iv", "fourth");
        addAlias(aliases, "5", "5th", "sem5", "semester5", "s5", "v", "fifth");
        addAlias(aliases, "6", "6th", "sem6", "semester6", "s6", "vi", "sixth");
        addAlias(aliases, "7", "7th", "sem7", "semester7", "s7", "vii", "seventh");
        addAlias(aliases, "8", "8th", "sem8", "semester8", "s8", "viii", "eighth");
        return aliases;
    }

    private static void addAlias(Map<String, String> aliases, String canonical, String... options) {
        aliases.put(canonical, canonical);
        for (String option : options) {
            aliases.put(normalizeAliasKey(option), canonical);
        }
    }

    private static String normalizeAliasKey(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }
}
