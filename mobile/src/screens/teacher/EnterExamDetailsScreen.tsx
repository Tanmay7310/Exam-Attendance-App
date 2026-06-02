import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, AcropolisSelectField, HeroCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';
import { useAppTheme } from '../../styles/appTheme';

export const EnterExamDetailsScreen = ({ navigation, route }: any) => {
  const returnTo = route?.params?.returnTo;
  const { auth, logout } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const branchToSemesters = useMemo(() => {
    const map = new Map<string, string[]>();

    subjects.forEach((item) => {
      const branchKey = item.branch?.trim() ?? '';
      const semesterValue = item.semester?.trim() ?? '';
      if (!branchKey || !semesterValue) return;
      if (!/^[1-8]$/.test(semesterValue)) return;

      const existing = map.get(branchKey) ?? [];
      if (!existing.includes(semesterValue)) {
        map.set(branchKey, [...existing, semesterValue].sort((a, b) => Number(a) - Number(b)));
      }
    });

    return map;
  }, [subjects]);

  const branchOptions = useMemo(
    () => Array.from(branchToSemesters.entries())
      .filter(([, semesters]) => !semester || semesters.includes(semester))
      .map(([branchName]) => branchName)
      .sort((a, b) => a.localeCompare(b)),
    [branchToSemesters, semester]
  );

  const semesterOptions = useMemo(() => {
    if (year === '1') return ['1', '2'];
    if (year === '2') return ['3', '4'];
    if (year === '3') return ['5', '6'];
    if (year === '4') return ['7', '8'];
    return [];
  }, [year]);

  const subjectOptions = useMemo(() => {
    if (!branch || !semester || !year) return [];
    return subjects
      .filter((item) =>
        item.branch.trim().toLowerCase() === branch.trim().toLowerCase()
        && item.semester.trim() === semester.trim()
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        value: item.name.trim(),
        label: `${item.name.trim()} (${item.subjectCode.trim()})`
      }));
  }, [subjects, branch, semester, year]);

  const yearOptions = useMemo(() => ['1', '2', '3', '4'].map((value) => ({ label: value, value })), []);

  const sectionOptions = useMemo(() => ['1', '2', '3', '4', '5'].map((value) => ({ label: value, value })), []);

  const semesterSelectOptions = useMemo(
    () => semesterOptions.map((value) => ({ label: value, value })),
    [semesterOptions]
  );

  const branchSelectOptions = useMemo(
    () => branchOptions.map((value) => ({ label: value, value })),
    [branchOptions]
  );

  const handleYearSelect = (selectedYear: string) => {
    setYear(selectedYear);
    const allowedSemesters =
      selectedYear === '1' ? ['1', '2']
      : selectedYear === '2' ? ['3', '4']
      : selectedYear === '3' ? ['5', '6']
      : selectedYear === '4' ? ['7', '8']
      : [];
    if (!allowedSemesters.includes(semester)) {
      setSemester('');
    }
  };

  const loadSubjects = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const endpoint = auth?.role === 'ADMIN' ? '/api/admin/subjects' : '/api/teacher/subjects';
      const { data } = await api.get<SubjectItem[]>(endpoint);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to load branches and semesters.'), { type: 'error' });
      setSubjects([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, [auth?.role, logout, showToast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (branch && !branchOptions.includes(branch)) {
      setBranch('');
    }

    if (semester && !semesterOptions.includes(semester)) {
      setSemester('');
    }
  }, [branch, semester, branchOptions, semesterOptions]);

  useEffect(() => {
    if (subject && !subjectOptions.some((option) => option.value === subject)) {
      setSubject('');
    }
  }, [subject, subjectOptions]);

  const canProceed = useMemo(
    () =>
      [subject, branch, semester, year, section].every((v) => v.trim().length > 0)
      && !loadingCatalog,
    [subject, branch, semester, year, section, loadingCatalog]
  );

  const stepStatus = useMemo(() => {
    if (!year || !semester) return 1;
    if (!branch || !section) return 2;
    return 3;
  }, [year, semester, branch, section]);

  const proceedToScan = () => {
    if (!canProceed) {
      showToast('Please enter Subject, Branch, Semester, Year and Section.', { type: 'info' });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Scan',
          params: {
            examDetails: {
              subject: subject.trim(),
              branch: branch.trim(),
              semester: semester.trim(),
              year: year.trim(),
              section: section.trim()
            },
            returnTo
          }
        }
      ]
    });
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title="Enter Exam Details" subtitle="Session Configuration" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <HeroCard style={styles.introCard}>
          <Text style={styles.introTitle}>Configure exam session</Text>
          <Text style={[styles.introText, { color: theme.headerSubtle }]}>
            Select the exact class and subject before opening the scanner.
            {loadingCatalog ? ' Loading latest branch and subject catalog...' : ''}
          </Text>
        </HeroCard>

        <View style={[styles.stepsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Step number="1" title="Year & Semester" active={stepStatus >= 1} complete={Boolean(year && semester)} />
          <Step number="2" title="Branch & Section" active={stepStatus >= 2} complete={Boolean(branch && section)} />
          <Step number="3" title="Subject" active={stepStatus >= 3} complete={Boolean(subject)} />
        </View>

        <SectionLabel title="Exam Details" />
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <AcropolisSelectField
            label="Year"
            value={year}
            placeholder="Select Year"
            options={yearOptions}
            helperText="Choose the academic year for this session."
            onSelect={handleYearSelect}
          />

          <AcropolisSelectField
            label="Semester"
            value={semester}
            placeholder={semesterOptions.length > 0 ? 'Select Semester' : 'Select Year First'}
            options={semesterSelectOptions}
            disabled={semesterOptions.length === 0}
            helperText={semesterOptions.length > 0 ? 'Only semesters valid for the selected year are shown.' : 'Year is required before semester.'}
            onSelect={setSemester}
          />

          <AcropolisSelectField
            label="Branch"
            value={branch}
            placeholder={loadingCatalog ? 'Loading Branches...' : branchSelectOptions.length > 0 ? 'Select Branch' : 'No Branches Found'}
            options={branchSelectOptions}
            disabled={loadingCatalog || branchSelectOptions.length === 0}
            helperText="Branches are filtered by the selected semester."
            onSelect={setBranch}
          />

          <AcropolisSelectField
            label="Section"
            value={section}
            placeholder="Select Section"
            options={sectionOptions}
            helperText="Choose the section for the selected class."
            onSelect={setSection}
          />

          <AcropolisSelectField
            label="Subject"
            value={subject}
            placeholder={
              !year
                ? 'Select Year First'
                : !semester
                  ? 'Select Semester First'
                  : !branch
                    ? 'Select Branch First'
                    : subjectOptions.length > 0
                      ? 'Select Subject'
                      : 'No Subjects Found'
            }
            options={subjectOptions}
            disabled={!(branch.length > 0 && semester.length > 0 && year.length > 0 && subjectOptions.length > 0)}
            helperText="Only subjects mapped to the selected branch and semester are shown."
            onSelect={setSubject}
          />
        </View>

        <Pressable onPress={proceedToScan} disabled={!canProceed} style={({ pressed }) => [styles.continueButton, { backgroundColor: theme.blue, shadowColor: theme.blue }, !canProceed && styles.disabledButton, pressed && canProceed && styles.pressed]}>
          <Text style={styles.continueText}>Continue To Scan</Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
};

const Step = ({ number, title, active, complete }: { number: string; title: string; active: boolean; complete: boolean }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepCircle, { backgroundColor: theme.card, borderColor: theme.border }, active && { borderColor: theme.blue, backgroundColor: theme.blueSoft }, complete && { backgroundColor: theme.blue, borderColor: theme.blue }]}>
        <Text style={[styles.stepNumber, { color: complete ? '#FFFFFF' : active ? theme.blue : theme.ghost }]}>{complete ? 'OK' : number}</Text>
      </View>
      <Text style={[styles.stepTitle, { color: active ? theme.ink : theme.muted }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  introCard: { padding: 16 },
  introTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  introText: { color: '#BFD1FF', marginTop: 6, lineHeight: 19, fontWeight: '700' },
  stepsCard: { marginTop: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 12, gap: 10 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: ACR.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  stepCircleActive: { borderColor: ACR.blue, backgroundColor: ACR.blueSoft },
  stepCircleComplete: { backgroundColor: ACR.blue, borderColor: ACR.blue },
  stepNumber: { color: ACR.ghost, fontSize: 12, fontWeight: '900' },
  stepNumberActive: { color: ACR.blue },
  stepTitle: { color: ACR.muted, fontSize: 13, fontWeight: '800' },
  stepTitleActive: { color: ACR.ink },
  formCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 24, padding: 14, gap: 12 },
  continueButton: { marginTop: 18, minHeight: 58, borderRadius: 18, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', shadowColor: ACR.blue, shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  disabledButton: { backgroundColor: '#A9B7D5', shadowOpacity: 0, elevation: 0 },
  pressed: { transform: [{ scale: 0.98 }] },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }
});
