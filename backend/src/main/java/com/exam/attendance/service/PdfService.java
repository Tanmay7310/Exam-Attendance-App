package com.exam.attendance.service;

import com.exam.attendance.dto.teacher.AttendanceRecordResponse;
import com.exam.attendance.dto.admin.AdminAttendanceResponse;
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

    public byte[] generateAdminAttendancePdf(LocalDate date, String teacherId, String subject, List<AdminAttendanceResponse> rows) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL);

            document.add(new Paragraph("Admin Attendance Report", titleFont));
            document.add(new Paragraph("Date: " + (date != null ? date : "All"), normalFont));
            document.add(new Paragraph("Teacher Filter: " + (teacherId != null && !teacherId.isBlank() ? teacherId : "All"), normalFont));
            document.add(new Paragraph("Subject Filter: " + (subject != null && !subject.isBlank() ? subject : "All"), normalFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.addCell("S. No.");
            table.addCell("Enrollment No.");
            table.addCell("Student Name");
            table.addCell("Teacher");
            table.addCell("Subject");
            table.addCell("Date");
            table.addCell("Time (12-hour)");

            int serialNumber = 1;
            for (AdminAttendanceResponse row : rows) {
                table.addCell(String.valueOf(serialNumber++));
                table.addCell(row.getEnrollmentNumber() == null ? "-" : row.getEnrollmentNumber());
                table.addCell(row.getStudentName());
                table.addCell(row.getTeacherName());
                table.addCell(row.getSubject());
                table.addCell(row.getDate() == null ? "-" : row.getDate().toString());

                if (row.getScannedAt() == null) {
                    table.addCell("-");
                } else {
                    ZonedDateTime scannedAt = row.getScannedAt().atZone(ZoneId.systemDefault());
                    table.addCell(scannedAt.format(PDF_TIME_FORMAT));
                }
            }

            document.add(table);
            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate admin PDF", e);
        }
    }
}
