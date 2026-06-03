package com.exam.attendance.service;

import com.exam.attendance.dto.teacher.AttendanceRecordResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceDetailsResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceStudentRecordResponse;
import com.exam.attendance.entity.Teacher;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class PdfService {

    private static final DateTimeFormatter PDF_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter PDF_TIME_FORMAT = DateTimeFormatter.ofPattern("hh:mm:ss a", Locale.ENGLISH);

    public byte[] generateAttendancePdf(Teacher teacher, LocalDate date, String reportSubject, List<AttendanceRecordResponse> records) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL);

            document.add(new Paragraph("Exam Attendance Report", titleFont));
            document.add(new Paragraph("Teacher: " + teacher.getName(), normalFont));
            document.add(new Paragraph("Subject: " + reportSubject, normalFont));
            document.add(new Paragraph("Teacher ID: " + teacher.getTeacherCode(), normalFont));
            document.add(new Paragraph("Date: " + date, normalFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.addCell("S. No.");
            table.addCell("Enrollment Number");
            table.addCell("Student Name");
            table.addCell("Date");
            table.addCell("Time (12-hour)");

            int serialNumber = 1;
            for (AttendanceRecordResponse record : records) {
                table.addCell(String.valueOf(serialNumber++));
                table.addCell(record.getEnrollmentNumber() == null ? "-" : record.getEnrollmentNumber());
                table.addCell(record.getStudentName());

                if (record.getScannedAt() == null) {
                    table.addCell("-");
                    table.addCell("-");
                } else {
                    ZonedDateTime scannedAt = record.getScannedAt().atZone(ZoneId.systemDefault());
                    table.addCell(scannedAt.format(PDF_DATE_FORMAT));
                    table.addCell(scannedAt.format(PDF_TIME_FORMAT));
                }
            }

            document.add(table);
            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generateAdminAttendancePdf(LocalDate date, String teacherId, String subject, List<SessionAttendanceDetailsResponse> sessions) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL);

            document.add(new Paragraph("Admin Attendance Report", titleFont));
            document.add(new Paragraph("Date: " + (date != null ? date : "All"), normalFont));
            document.add(new Paragraph("Teacher Filter: " + (teacherId != null && !teacherId.isBlank() ? teacherId : "All"), normalFont));
            document.add(new Paragraph("Subject Filter: " + (subject != null && !subject.isBlank() ? subject : "All"), normalFont));
            document.add(new Paragraph(" "));

            if (sessions.isEmpty()) {
                document.add(new Paragraph("No attendance records found.", normalFont));
            }

            for (SessionAttendanceDetailsResponse session : sessions) {
                addSessionContext(document, normalFont, null, null, session);
                document.add(buildSessionRecordsTable(session));
                document.add(new Paragraph(" "));
            }

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate admin PDF", e);
        }
    }

    public byte[] generateSessionAttendancePdf(String title, String teacherName, String teacherCode, SessionAttendanceDetailsResponse details) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL);

            document.add(new Paragraph(title, titleFont));
            addSessionContext(document, normalFont, teacherName, teacherCode, details);
            document.add(new Paragraph(" "));
            document.add(buildSessionRecordsTable(details));
            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate session PDF", e);
        }
    }

    private void addSessionContext(Document document,
                                   Font normalFont,
                                   String teacherName,
                                   String teacherCode,
                                   SessionAttendanceDetailsResponse details) throws DocumentException {
        document.add(new Paragraph("Session ID: " + details.getSessionId(), normalFont));
        document.add(new Paragraph("Date: " + (details.getDate() == null ? "-" : details.getDate()), normalFont));
        document.add(new Paragraph("Subject: " + safe(details.getSubject()), normalFont));
        if (teacherName != null || teacherCode != null) {
            document.add(new Paragraph("Teacher: " + safe(teacherName) + " (" + safe(teacherCode) + ")", normalFont));
        }
        document.add(new Paragraph("Class: Year " + safe(details.getExamYear()) + " | Sem " + safe(details.getExamSemester())
                + " | " + safe(details.getExamBranch()) + "-" + safe(details.getExamSection()), normalFont));
        document.add(new Paragraph("Present: " + details.getPresentCount()
                + " | Absent: " + details.getAbsentCount()
                + " | Total: " + details.getTotalCount(), normalFont));
        if (!details.isRosterResolved()) {
            document.add(new Paragraph("Note: Absent roster is unavailable for this legacy session.", normalFont));
        }
    }

    private PdfPTable buildSessionRecordsTable(SessionAttendanceDetailsResponse details) throws DocumentException {
        PdfPTable table = new PdfPTable(8);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.7f, 1.5f, 1.7f, 2.4f, 1.1f, 1.1f, 1.4f, 1.7f});
        table.addCell("S. No.");
        table.addCell("Scholar No.");
        table.addCell("Enrollment No.");
        table.addCell("Student Name");
        table.addCell("Status");
        table.addCell("Scan Time");
        table.addCell("Adjusted");
        table.addCell("Reason");

        int serialNumber = 1;
        for (SessionAttendanceStudentRecordResponse row : details.getRecords()) {
            table.addCell(String.valueOf(serialNumber++));
            table.addCell(safe(row.getScholarNumber()));
            table.addCell(safe(row.getEnrollmentNumber()));
            table.addCell(safe(row.getStudentName()));
            table.addCell(safe(row.getStatus()));

            if (row.getScannedAt() == null) {
                table.addCell("-");
            } else {
                ZonedDateTime scannedAt = row.getScannedAt().atZone(ZoneId.systemDefault());
                table.addCell(scannedAt.format(PDF_TIME_FORMAT));
            }

            table.addCell(row.isAdjusted() ? "Yes" : "No");
            table.addCell(row.isAdjusted() ? safe(row.getAdjustmentReason()) : "-");
        }

        return table;
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
