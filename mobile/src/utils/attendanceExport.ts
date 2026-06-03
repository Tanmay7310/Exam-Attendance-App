import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from '../api/client';
import { Role } from '../types';

export type ExportFormat = 'pdf' | 'excel';

type AdminReportFilters = {
  date?: string;
  teacherId?: string;
  subject?: string;
};

type DownloadAttendanceExportParams = {
  endpoint: string;
  token?: string;
  fileBaseName: string;
  format: ExportFormat;
};

const extensionFor = (format: ExportFormat) => (format === 'pdf' ? 'pdf' : 'xlsx');

const mimeTypeFor = (format: ExportFormat) => (
  format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);

const sanitizeFileName = (value: string) => {
  const normalized = value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return normalized || 'attendance-report';
};

export const buildAdminAttendanceReportEndpoint = (format: ExportFormat, filters: AdminReportFilters) => {
  const params: string[] = [];
  const date = filters.date?.trim();
  const teacherId = filters.teacherId?.trim();
  const subject = filters.subject?.trim();

  if (date) params.push(`date=${encodeURIComponent(date)}`);
  if (teacherId) params.push(`teacherId=${encodeURIComponent(teacherId)}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);

  const query = params.length ? `?${params.join('&')}` : '';
  return `/api/admin/attendance/report/${format}${query}`;
};

export const buildSessionAttendanceReportEndpoint = (format: ExportFormat, role: Role | undefined, sessionId: number) => {
  const prefix = role === 'ADMIN' ? '/api/admin' : '/api/teacher';
  return `${prefix}/attendance/sessions/${sessionId}/report/${format}`;
};

export const buildExportFileName = (baseName: string, format: ExportFormat) => {
  return `${sanitizeFileName(baseName)}.${extensionFor(format)}`;
};

export const downloadAndShareAttendanceExport = async ({
  endpoint,
  token,
  fileBaseName,
  format
}: DownloadAttendanceExportParams) => {
  const fileUri = `${FileSystem.documentDirectory}${buildExportFileName(fileBaseName, format)}`;
  const url = `${api.defaults.baseURL}${endpoint}`;

  await FileSystem.downloadAsync(url, fileUri, {
    headers: {
      Authorization: `Bearer ${token ?? ''}`
    }
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: mimeTypeFor(format),
      dialogTitle: format === 'pdf' ? 'Share attendance PDF' : 'Share attendance Excel'
    });
    return { fileUri, shared: true };
  }

  return { fileUri, shared: false };
};

export const exportFormatLabel = (format: ExportFormat) => (format === 'pdf' ? 'PDF' : 'Excel');
