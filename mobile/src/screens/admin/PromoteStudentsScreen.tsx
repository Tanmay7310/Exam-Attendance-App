import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminCard, AdminEmpty, AdminPickerFrame, AdminPrimaryButton, AdminStatTile, adminStyles } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PromotionClassContext, StudentPromotionBatchDetail, StudentPromotionCandidate, StudentPromotionPreviewResponse, SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

const YEAR_OPTIONS = ['1', '2', '3', '4'];
const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const SECTION_OPTIONS = ['1', '2', '3', '4', '5'];

const getNextContext = (from: PromotionClassContext): PromotionClassContext => {
  const fromSemester = Number(from.semester);
  if (!Number.isFinite(fromSemester) || fromSemester < 1 || fromSemester > 8) return { ...from };
  const nextSemester = Math.min(fromSemester + 1, 8);
  const nextYear = String(Math.ceil(nextSemester / 2));
  return { year: nextYear, semester: String(nextSemester), branch: from.branch, section: from.section };
};

export const PromoteStudentsScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<StudentPromotionPreviewResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [from, setFrom] = useState<PromotionClassContext>({ year: '', semester: '', branch: '', section: '' });
  const [to, setTo] = useState<PromotionClassContext>({ year: '', semester: '', branch: '', section: '' });

  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    subjects.forEach((subject) => {
      const branch = subject.branch?.trim();
      if (branch) branches.add(branch);
    });
    return Array.from(branches).sort((a, b) => a.localeCompare(b));
  }, [subjects]);

  const handleAuthError = useCallback(async (error: any) => {
    return handleSessionExpired(error, logout, showToast);
  }, [logout, showToast]);

  const loadBranches = useCallback(async () => {
    try {
      setLoadingBranches(true);
      const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(getApiErrorMessage(error, 'Unable to load branch catalog.'), { type: 'error' });
      setSubjects([]);
    } finally {
      setLoadingBranches(false);
    }
  }, [handleAuthError, showToast]);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  const toggleSelected = (studentId: number) => {
    setSelectedIds((prev) => prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]);
  };

  const canPreview = useMemo(() => [from.year, from.semester, from.branch, from.section].every((value) => value.trim().length > 0), [from]);
  const canExecute = useMemo(() => !!preview && selectedIds.length > 0 && [to.year, to.semester, to.branch, to.section].every((value) => value.trim().length > 0), [preview, selectedIds.length, to]);

  const previewPromotion = async () => {
    if (!canPreview) {
      showToast('Please select Year, Semester, Branch and Section first.', { type: 'info' });
      return;
    }
    try {
      setLoadingPreview(true);
      const { data } = await api.post<StudentPromotionPreviewResponse>('/api/admin/students/promotions/preview', { from });
      setPreview(data);
      const allIds = (data?.candidates ?? []).map((candidate) => candidate.id);
      setSelectedIds(allIds);
      setTo(getNextContext(from));
      showToast(`Preview loaded: ${data?.candidateCount ?? allIds.length} students`, { type: 'success' });
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(getApiErrorMessage(error, 'Unable to preview promotion.'), { type: 'error' });
      setPreview(null);
      setSelectedIds([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const executePromotion = async () => {
    if (!canExecute) {
      showToast('Select students and target class before executing.', { type: 'info' });
      return;
    }
    try {
      setExecuting(true);
      const { data } = await api.post<StudentPromotionBatchDetail>('/api/admin/students/promotions/execute', { from, to, studentIds: selectedIds });
      showToast(`Promotion completed. Promoted: ${data?.batch?.promotedCount ?? 0}`, { type: 'success' });
      if (data?.batch?.id) navigation.navigate('PromotionBatchDetails', { batchId: data.batch.id });
      setPreview(null);
      setSelectedIds([]);
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(getApiErrorMessage(error, 'Unable to execute promotion.'), { type: 'error' });
    } finally {
      setExecuting(false);
    }
  };

  const renderPicker = (label: string, value: string, onValueChange: (value: string) => void, options: string[], placeholder: string) => (
    <AdminPickerFrame label={label} style={styles.flexField}>
      <Picker selectedValue={value} onValueChange={(next) => onValueChange(String(next))} style={styles.picker}>
        <Picker.Item label={placeholder} value="" />
        {options.map((option) => <Picker.Item key={option} label={option} value={option} />)}
      </Picker>
    </AdminPickerFrame>
  );

  const renderCandidate = (item: StudentPromotionCandidate) => {
    const checked = selectedIds.includes(item.id);
    return (
      <Pressable key={item.id} onPress={() => toggleSelected(item.id)} style={[styles.candidateCard, checked && styles.candidateSelected]}>
        <View style={[styles.checkCircle, checked && styles.checkCircleSelected]}>{checked ? <View style={styles.checkDot} /> : null}</View>
        <View style={styles.candidateCopy}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>Scholar: {item.scholarNumber}</Text>
          <Text style={styles.meta}>Enrollment: {item.enrollmentNumber} | Sec {item.section}</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>Y{item.year} S{item.semester}</Text></View>
      </Pressable>
    );
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title="Promote Students" subtitle="Cohort movement" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel title="Current Class" />
        <AdminCard style={styles.panel}>
          <View style={styles.twoCol}>{renderPicker('Year', from.year, (value) => setFrom((prev) => ({ ...prev, year: value })), YEAR_OPTIONS, 'Select Year')}{renderPicker('Semester', from.semester, (value) => setFrom((prev) => ({ ...prev, semester: value })), SEMESTER_OPTIONS, 'Select Semester')}</View>
          <AdminPickerFrame label="Branch">
            <Picker selectedValue={from.branch} onValueChange={(value) => setFrom((prev) => ({ ...prev, branch: String(value) }))} style={styles.picker}>
              <Picker.Item label={loadingBranches ? 'Loading Branches...' : 'Select Branch'} value="" />
              {branchOptions.map((option) => <Picker.Item key={option} label={option} value={option} />)}
            </Picker>
          </AdminPickerFrame>
          {renderPicker('Section', from.section, (value) => setFrom((prev) => ({ ...prev, section: value })), SECTION_OPTIONS, 'Select Section')}
          <AdminPrimaryButton label="Preview Students" onPress={previewPromotion} loading={loadingPreview} disabled={loadingPreview || !canPreview} />
        </AdminCard>

        {preview ? (
          <>
            <View style={styles.statsRow}>
              <AdminStatTile label="Candidates" value={preview.candidateCount} tone="blue" />
              <AdminStatTile label="Selected" value={selectedIds.length} tone="green" />
            </View>

            <SectionLabel title="Target Class" />
            <AdminCard style={styles.panel}>
              <AdminPrimaryButton label="Autofill Next Semester" onPress={() => setTo(getNextContext(from))} tone="green" />
              <View style={styles.twoCol}>{renderPicker('Year', to.year, (value) => setTo((prev) => ({ ...prev, year: value })), YEAR_OPTIONS, 'Select Year')}{renderPicker('Semester', to.semester, (value) => setTo((prev) => ({ ...prev, semester: value })), SEMESTER_OPTIONS, 'Select Semester')}</View>
              <AdminPickerFrame label="Branch">
                <Picker selectedValue={to.branch} onValueChange={(value) => setTo((prev) => ({ ...prev, branch: String(value) }))} style={styles.picker}>
                  <Picker.Item label={loadingBranches ? 'Loading Branches...' : 'Select Branch'} value="" />
                  {branchOptions.map((option) => <Picker.Item key={option} label={option} value={option} />)}
                </Picker>
              </AdminPickerFrame>
              {renderPicker('Section', to.section, (value) => setTo((prev) => ({ ...prev, section: value })), SECTION_OPTIONS, 'Select Section')}
              <AdminPrimaryButton label={`Execute Promotion (${selectedIds.length})`} tone="green" onPress={executePromotion} loading={executing} disabled={executing || !canExecute} />
            </AdminCard>

            <SectionLabel title="Candidates" />
            <View style={styles.selectionRow}>
              <Pressable onPress={() => setSelectedIds((preview.candidates ?? []).map((candidate) => candidate.id))} style={styles.miniButton}><Text style={styles.miniButtonText}>Select All</Text></Pressable>
              <Pressable onPress={() => setSelectedIds([])} style={styles.miniButtonNeutral}><Text style={styles.miniButtonNeutralText}>Clear</Text></Pressable>
            </View>
            {preview.candidates.length === 0 ? <AdminEmpty title="No students found" subtitle="Adjust source class filters above." /> : preview.candidates.map(renderCandidate)}
          </>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  panel: { padding: 14, gap: 12 },
  picker: { color: ACR.ink },
  twoCol: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  selectionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 10 },
  miniButton: { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  miniButtonText: { color: ACR.blue, fontSize: 11, fontWeight: '900' },
  miniButtonNeutral: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  miniButtonNeutralText: { color: ACR.muted, fontSize: 11, fontWeight: '900' },
  candidateCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  candidateSelected: { borderColor: ACR.blue, backgroundColor: 'rgba(37,99,235,0.04)' },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkCircleSelected: { borderColor: ACR.blue, backgroundColor: ACR.blue },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  candidateCopy: { flex: 1 },
  name: { color: ACR.ink, fontSize: 14, fontWeight: '900' },
  meta: { color: ACR.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  badge: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: ACR.green, fontSize: 10, fontWeight: '900' }
});
