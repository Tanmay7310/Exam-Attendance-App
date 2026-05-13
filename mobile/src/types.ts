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
  examYear?: string;
  examSemester?: string;
  examBranch?: string;
  examSection?: string;
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
  year?: string;
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
  examYear?: string;
  examSemester?: string;
  examBranch?: string;
  examSection?: string;
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

export interface ImportSubjectsResponse {
  importedCount: number;
  skippedCount: number;
  errors: string[];
  importBatchId?: string;
}

export interface PromotionClassContext {
  year: string;
  semester: string;
  branch: string;
  section: string;
}

export interface StudentPromotionCandidate {
  id: number;
  name: string;
  scholarNumber: string;
  enrollmentNumber: string;
  year: string;
  semester: string;
  branch: string;
  section: string;
}

export interface StudentPromotionPreviewResponse {
  from: PromotionClassContext;
  candidateCount: number;
  candidates: StudentPromotionCandidate[];
}

export interface StudentPromotionItem {
  id: number;
  studentId: number;
  studentName: string;
  scholarNumber: string;
  enrollmentNumber: string;
  fromYear: string;
  fromSemester: string;
  fromBranch: string;
  fromSection: string;
  toYear: string;
  toSemester: string;
  toBranch: string;
  toSection: string;
  status: string;
  reason?: string | null;
}

export interface StudentPromotionBatchSummary {
  id: number;
  fromYear: string;
  fromSemester: string;
  fromBranch: string;
  fromSection: string;
  toYear: string;
  toSemester: string;
  toBranch: string;
  toSection: string;
  promotedBy: string;
  promotedAt: string;
  status: string;
  totalItems: number;
  promotedCount: number;
  skippedCount: number;
  failedCount: number;
  rolledBackCount: number;
  rollbackFailedCount: number;
}

export interface StudentPromotionBatchDetail {
  batch: StudentPromotionBatchSummary;
  items: StudentPromotionItem[];
}

export interface StudentPromotionRollbackResponse {
  batchId: number;
  attempted: number;
  rolledBack: number;
  failed: number;
  errors: string[];
  status: string;
}
