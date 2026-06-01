import { StudentItem } from '../../types';

export const UNASSIGNED_KEY = '__UNASSIGNED__';

export type StudentGroup = {
  key: string;
  label: string;
  count: number;
};

const VALID_YEARS = ['1', '2', '3', '4'];
const VALID_SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const VALID_SECTIONS = ['1', '2', '3', '4', '5'];

const clean = (value?: string | null) => (value ?? '').trim();

const getNumericKey = (value: string | undefined, allowed: string[]) => {
  const normalized = clean(value);
  const direct = allowed.includes(normalized) ? normalized : '';
  if (direct) return direct;

  const matched = normalized.match(/\d+/)?.[0] ?? '';
  return allowed.includes(matched) ? matched : UNASSIGNED_KEY;
};

export const getYearKey = (student: StudentItem) => getNumericKey(student.year, VALID_YEARS);

export const getSemesterKey = (student: StudentItem) => getNumericKey(student.semester, VALID_SEMESTERS);

export const getSectionKey = (student: StudentItem) => getNumericKey(student.section, VALID_SECTIONS);

export const getBranchKey = (student: StudentItem) => clean(student.department) || UNASSIGNED_KEY;

export const getYearLabel = (key: string) => {
  if (key === UNASSIGNED_KEY) return 'Unassigned Year';
  const suffix = key === '1' ? 'st' : key === '2' ? 'nd' : key === '3' ? 'rd' : 'th';
  return `${key}${suffix} Year`;
};

export const getSemesterLabel = (key: string) => key === UNASSIGNED_KEY ? 'Unassigned Semester' : `Semester ${key}`;

export const getBranchLabel = (key: string) => key === UNASSIGNED_KEY ? 'Unassigned Branch' : key;

export const getSectionLabel = (key: string) => key === UNASSIGNED_KEY ? 'Unassigned Section' : `Section ${key}`;

const countBy = (students: StudentItem[], keyFor: (student: StudentItem) => string) => {
  const counts = new Map<string, number>();
  students.forEach((student) => {
    const key = keyFor(student);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};

export const buildYearGroups = (students: StudentItem[]): StudentGroup[] => {
  const counts = countBy(students, getYearKey);
  const groups = VALID_YEARS.map((key) => ({
    key,
    label: getYearLabel(key),
    count: counts.get(key) ?? 0
  }));

  const unassignedCount = counts.get(UNASSIGNED_KEY) ?? 0;
  if (unassignedCount > 0) {
    groups.push({ key: UNASSIGNED_KEY, label: getYearLabel(UNASSIGNED_KEY), count: unassignedCount });
  }

  return groups;
};

export const buildSemesterGroups = (students: StudentItem[]): StudentGroup[] => {
  const counts = countBy(students, getSemesterKey);
  const groups = VALID_SEMESTERS
    .filter((key) => (counts.get(key) ?? 0) > 0)
    .map((key) => ({ key, label: getSemesterLabel(key), count: counts.get(key) ?? 0 }));

  const unassignedCount = counts.get(UNASSIGNED_KEY) ?? 0;
  if (unassignedCount > 0) {
    groups.push({ key: UNASSIGNED_KEY, label: getSemesterLabel(UNASSIGNED_KEY), count: unassignedCount });
  }

  return groups;
};

export const buildBranchGroups = (students: StudentItem[]): StudentGroup[] => {
  const counts = countBy(students, getBranchKey);
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: getBranchLabel(key), count }))
    .sort((a, b) => {
      if (a.key === UNASSIGNED_KEY) return 1;
      if (b.key === UNASSIGNED_KEY) return -1;
      return a.label.localeCompare(b.label);
    });
};

export const buildSectionGroups = (students: StudentItem[]): StudentGroup[] => {
  const counts = countBy(students, getSectionKey);
  const groups = VALID_SECTIONS
    .filter((key) => (counts.get(key) ?? 0) > 0)
    .map((key) => ({ key, label: getSectionLabel(key), count: counts.get(key) ?? 0 }));

  const unassignedCount = counts.get(UNASSIGNED_KEY) ?? 0;
  if (unassignedCount > 0) {
    groups.push({ key: UNASSIGNED_KEY, label: getSectionLabel(UNASSIGNED_KEY), count: unassignedCount });
  }

  return groups;
};

export const filterByYear = (students: StudentItem[], yearKey: string) => students.filter((student) => getYearKey(student) === yearKey);

export const filterBySemester = (students: StudentItem[], semesterKey: string) => students.filter((student) => getSemesterKey(student) === semesterKey);

export const filterByBranch = (students: StudentItem[], branchKey: string) => students.filter((student) => getBranchKey(student) === branchKey);

export const filterBySection = (students: StudentItem[], sectionKey: string) => students.filter((student) => getSectionKey(student) === sectionKey);
