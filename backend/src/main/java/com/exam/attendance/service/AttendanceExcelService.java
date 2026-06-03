package com.exam.attendance.service;

import com.exam.attendance.dto.attendance.SessionAttendanceDetailsResponse;
import com.exam.attendance.dto.attendance.SessionAttendanceStudentRecordResponse;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class AttendanceExcelService {

    public static final String CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private static final DateTimeFormatter EXCEL_TIME_FORMAT = DateTimeFormatter.ofPattern("hh:mm:ss a", Locale.ENGLISH);
    private static final String[] HEADERS = {
            "Session ID",
            "Date",
            "Subject",
            "Teacher Name",
            "Teacher Code",
            "Year",
            "Semester",
            "Branch",
            "Section",
            "S. No.",
            "Scholar No.",
            "Enrollment No.",
            "Student Name",
            "Status",
            "Scan Time",
            "Adjusted",
            "Reason"
    };

    public byte[] generateAdminAttendanceExcel(LocalDate date, String teacherId, String subject, List<ExportSession> sessions) {
        String title = "Admin Attendance Report";
        return buildWorkbook(title, sessions);
    }

    public byte[] generateSessionAttendanceExcel(String title, String teacherName, String teacherCode, SessionAttendanceDetailsResponse details) {
        return buildWorkbook(title, List.of(new ExportSession(teacherName, teacherCode, details)));
    }

    private byte[] buildWorkbook(String title, List<ExportSession> sessions) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance");
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);

            int rowIndex = 0;
            Row titleRow = sheet.createRow(rowIndex++);
            titleRow.createCell(0).setCellValue(title);
            titleRow.getCell(0).setCellStyle(titleStyle);

            rowIndex++;
            Row headerRow = sheet.createRow(rowIndex++);
            for (int i = 0; i < HEADERS.length; i++) {
                headerRow.createCell(i).setCellValue(HEADERS[i]);
                headerRow.getCell(i).setCellStyle(headerStyle);
            }

            int serialNumber = 1;
            for (ExportSession session : sessions) {
                SessionAttendanceDetailsResponse details = session.details();
                for (SessionAttendanceStudentRecordResponse record : details.getRecords()) {
                    Row row = sheet.createRow(rowIndex++);
                    int col = 0;
                    row.createCell(col++).setCellValue(details.getSessionId() == null ? "-" : String.valueOf(details.getSessionId()));
                    row.createCell(col++).setCellValue(details.getDate() == null ? "-" : details.getDate().toString());
                    row.createCell(col++).setCellValue(safe(details.getSubject()));
                    row.createCell(col++).setCellValue(safe(session.teacherName()));
                    row.createCell(col++).setCellValue(safe(session.teacherCode()));
                    row.createCell(col++).setCellValue(safe(details.getExamYear()));
                    row.createCell(col++).setCellValue(safe(details.getExamSemester()));
                    row.createCell(col++).setCellValue(safe(details.getExamBranch()));
                    row.createCell(col++).setCellValue(safe(details.getExamSection()));
                    row.createCell(col++).setCellValue(serialNumber++);
                    row.createCell(col++).setCellValue(safe(record.getScholarNumber()));
                    row.createCell(col++).setCellValue(safe(record.getEnrollmentNumber()));
                    row.createCell(col++).setCellValue(safe(record.getStudentName()));
                    row.createCell(col++).setCellValue(safe(record.getStatus()));
                    row.createCell(col++).setCellValue(formatScanTime(record));
                    row.createCell(col++).setCellValue(record.isAdjusted() ? "Yes" : "No");
                    row.createCell(col).setCellValue(record.isAdjusted() ? safe(record.getAdjustmentReason()) : "-");
                }
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate attendance Excel", e);
        }
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private String formatScanTime(SessionAttendanceStudentRecordResponse row) {
        if (row.getScannedAt() == null) {
            return "-";
        }
        ZonedDateTime scannedAt = row.getScannedAt().atZone(ZoneId.systemDefault());
        return scannedAt.format(EXCEL_TIME_FORMAT);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    public record ExportSession(String teacherName, String teacherCode, SessionAttendanceDetailsResponse details) {
    }
}
