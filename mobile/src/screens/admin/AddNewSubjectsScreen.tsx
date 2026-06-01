import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL, api } from '../../api/client';
import { ACR, AcropolisBackBar, IconMark, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminFormCard, AdminOutlineButton, AdminPrimaryButton, AdminTextField } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ImportSubjectsResponse } from '../../types';

export const AddNewSubjectsScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const addSubject = async () => {
    if (submitting) return;
    if (!name.trim() || !subjectCode.trim() || !branch.trim() || !semester.trim()) {
      showToast('Please enter Subject Name, Subject Code, Branch and Semester.', { type: 'info' });
      return;
    }

    try {
      setSubmitting(true);
      showToast('Adding subject...', { type: 'info', duration: 1200 });
      await api.post('/api/admin/subjects', { name: name.trim(), subjectCode: subjectCode.trim(), branch: branch.trim(), semester: semester.trim() });
      setName(''); setSubjectCode(''); setBranch(''); setSemester('');
      showToast('Subject added successfully.', { type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      const message = (typeof e?.response?.data === 'string' && e.response.data.trim()) || e?.response?.data?.message || e?.message || 'Unable to add subject.';
      showToast(e?.message === 'Network Error' ? `Network error. API: ${API_BASE_URL}` : message, { type: 'error', duration: e?.message === 'Network Error' ? 4200 : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  const importSubjects = async () => {
    if (importing) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        multiple: false,
        copyToCacheDirectory: true
      });
      if (picked.canceled || !picked.assets?.length) return;

      const file = picked.assets[0];
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' } as any);

      setImporting(true);
      const { data } = await api.post<ImportSubjectsResponse>('/api/admin/subjects/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const imported = data?.importedCount ?? 0;
      const skipped = data?.skippedCount ?? 0;
      const errors = Array.isArray(data?.errors) ? data.errors : [];
      const batchId = data?.importBatchId;
      const preview = errors.slice(0, 5).join(' | ');

      showToast(`Import completed. Imported: ${imported}, Skipped: ${skipped}`, { type: 'success', duration: 3400 });
      if (batchId) showToast(`Import Batch: ${batchId}`, { type: 'info', duration: 2800 });
      if (preview) showToast(`Sample issues: ${preview}`, { type: 'info', duration: 4200 });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      const message = (typeof e?.response?.data === 'string' && e.response.data.trim()) || e?.response?.data?.message || e?.message || 'Unable to import subjects from file.';
      showToast(e?.message === 'Network Error' ? `Network error. API: ${API_BASE_URL}` : message, { type: 'error', duration: e?.message === 'Network Error' ? 4200 : undefined });
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title="Add New Subject" subtitle="Subject configuration" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionLabel title="Subject Details" />
        <AdminFormCard title="Manual Subject" helper="Branch and semester are validated by the backend.">
          <AdminTextField label="Subject Name *" value={name} onChangeText={setName} />
          <AdminTextField label="Subject Code *" value={subjectCode} onChangeText={setSubjectCode} autoCapitalize="characters" inputStyle={styles.monoInput} />
          <View style={styles.twoCol}>
            <AdminTextField label="Branch *" value={branch} onChangeText={setBranch} style={styles.flexField} />
            <AdminTextField label="Semester *" value={semester} onChangeText={setSemester} style={styles.flexField} keyboardType="number-pad" />
          </View>
          <AdminPrimaryButton label="Add Subject" onPress={addSubject} loading={submitting} disabled={submitting || importing} />
        </AdminFormCard>

        <SectionLabel title="Bulk Import" />
        <View style={styles.importCard}>
          <IconMark kind="book" tone="amber" size={48} />
          <View style={styles.importCopy}>
            <Text style={styles.importTitle}>Import Subjects</Text>
            <Text style={styles.importMeta}>Upload normalized Excel subject sheets.</Text>
          </View>
          <AdminOutlineButton label={importing ? 'Importing...' : 'Import'} onPress={importSubjects} disabled={importing || submitting} tone="blue" style={styles.importButton} />
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  monoInput: { fontFamily: 'monospace' },
  twoCol: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 },
  importCard: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  importCopy: { flex: 1 },
  importTitle: { color: ACR.ink, fontSize: 14, fontWeight: '900' },
  importMeta: { color: ACR.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  importButton: { minWidth: 86 }
});
