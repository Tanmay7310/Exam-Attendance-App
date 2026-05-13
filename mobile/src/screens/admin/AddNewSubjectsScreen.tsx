import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Text, TextInput } from 'react-native-paper';
import { API_BASE_URL, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';
import { ImportSubjectsResponse } from '../../types';

export const AddNewSubjectsScreen = () => {
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

      await api.post('/api/admin/subjects', {
        name: name.trim(),
        subjectCode: subjectCode.trim(),
        branch: branch.trim(),
        semester: semester.trim()
      });
      setName('');
      setSubjectCode('');
      setBranch('');
      setSemester('');
      showToast('Subject added successfully.', { type: 'success' });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      const message =
        (typeof e?.response?.data === 'string' && e.response.data.trim())
        || e?.response?.data?.message
        || e?.message
        || 'Unable to add subject.';
      if (e?.message === 'Network Error') {
        showToast(`Network error. API: ${API_BASE_URL}`, { type: 'error', duration: 4200 });
      } else {
        showToast(message, { type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const importSubjects = async () => {
    if (importing) return;

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        multiple: false,
        copyToCacheDirectory: true
      });

      if (picked.canceled || !picked.assets?.length) {
        return;
      }

      const file = picked.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/octet-stream'
      } as any);

      setImporting(true);
      const { data } = await api.post<ImportSubjectsResponse>('/api/admin/subjects/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const imported = data?.importedCount ?? 0;
      const skipped = data?.skippedCount ?? 0;
      const errors = Array.isArray(data?.errors) ? data.errors : [];
      const batchId = data?.importBatchId;
      const preview = errors.slice(0, 5).join(' | ');

      showToast(`Import completed. Imported: ${imported}, Skipped: ${skipped}`, { type: 'success', duration: 3400 });
      if (batchId) {
        showToast(`Import Batch: ${batchId}`, { type: 'info', duration: 2800 });
      }
      if (preview) {
        showToast(`Sample issues: ${preview}`, { type: 'info', duration: 4200 });
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      const message =
        (typeof e?.response?.data === 'string' && e.response.data.trim())
        || e?.response?.data?.message
        || e?.message
        || 'Unable to import subjects from file.';
      if (e?.message === 'Network Error') {
        showToast(`Network error. API: ${API_BASE_URL}`, { type: 'error', duration: 4200 });
      } else {
        showToast(message, { type: 'error' });
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Add New Subject</Text>

      <TextInput label="Subject Name" mode="outlined" style={styles.input} value={name} onChangeText={setName} />
      <TextInput label="Subject Code" mode="outlined" style={styles.input} value={subjectCode} onChangeText={setSubjectCode} />
      <TextInput label="Branch" mode="outlined" style={styles.input} value={branch} onChangeText={setBranch} />
      <TextInput label="Semester" mode="outlined" style={styles.input} value={semester} onChangeText={setSemester} />

      <Button mode="contained" contentStyle={buttonStyles.content} onPress={addSubject} loading={submitting} disabled={submitting || importing}>
        Add Subject
      </Button>
      <Button
        mode="contained"
        style={styles.importButton}
        contentStyle={buttonStyles.content}
        onPress={importSubjects}
        loading={importing}
        disabled={importing || submitting}
      >
        Import Subjects (Excel)
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: { marginBottom: 8 },
  importButton: { marginTop: 10, borderRadius: 12 }
});
