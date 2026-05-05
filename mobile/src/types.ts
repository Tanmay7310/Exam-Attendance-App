export type Role = 'ADMIN' | 'TEACHER';

export interface LoginResponse {
  token: string;
  role: Role;
  username: string;
  teacherName?: string;
  subject?: string;
  teacherCode?: string;
}

export interface AttendanceRecord {
  scholarNumber: string;
  enrollmentNumber?: string;
  studentName: string;
  scannedAt: string;
  date?: string;
  subject?: string;
}

export interface TeacherProfile {
  teacherCode: string;
  name: string;
  subject: string;
}

export interface TeacherItem {
  id: number;
  username: string;
  teacherCode: string;
  name: string;
  subject: string;
}

export interface StudentItem {
  id: number;
  name: string;
  scholarNumber: string;
  enrollmentNumber: string;
  department: string;
  semester?: string;
  section: string;
}

export interface AdminAttendance {
  teacherName: string;
  teacherCode: string;
  subject: string;
  scholarNumber: string;
  enrollmentNumber: string;
  studentName: string;
  date: string;
  scannedAt: string;
}

export interface SubjectItem {
  id: number;
  name: string;
  subjectCode: string;
  branch: string;
  semester: string;
}
