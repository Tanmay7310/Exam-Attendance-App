import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { SubjectItem } from '../../types';
import { colors } from '../../styles/theme';

export const SubjectsListScreen = ({ route, navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const branch: string = route?.params?.branch ?? '';
  const semester: string = route?.params?.semester ?? '';
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SubjectItem | null>(null);

  const loadSubjects = React.useCallback(async () => {
    const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
    const filtered = data.filter(
      (item) =>
        item.branch.trim().toLowerCase() === branch.trim().toLowerCase() &&
        item.semester.trim() === semester.trim()
    );
    setSubjects(filtered);
    setLoadingFailed(false);
  }, [branch, semester]);

  React.useEffect(() => {
    const runLoad = () => {
      loadSubjects().catch(async (e: any) => {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          showToast('Session expired. Please login again.', { type: 'error' });
          await logout();
          return;
        }
        setLoadingFailed(true);
        showToast(e?.response?.data?.message ?? 'Unable to load subjects.', { type: 'error' });
      });
    };

    runLoad();
    const unsubscribe = navigation.addListener('focus', runLoad);
    return unsubscribe;
  }, [loadSubjects, logout, navigation, showToast]);
  const sortedSubjects = useMemo(() => {
    const getLastCodeDigit = (code: string) => {
      const match = code?.match(/(\d)(?!.*\d)/);
      return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    };

    return [...subjects].sort((a, b) => {
      const byLastDigit = getLastCodeDigit(a.subjectCode) - getLastCodeDigit(b.subjectCode);
      if (byLastDigit !== 0) return byLastDigit;

      const byCode = a.subjectCode.localeCompare(b.subjectCode);
      if (byCode !== 0) return byCode;

      return a.name.localeCompare(b.name);
    });
  }, [subjects]);

  const openEdit = (item: SubjectItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditCode(item.subjectCode);
  };

  const closeEdit = (force = false) => {
    if (saving && !force) return;
    setEditing(null);
    setEditName('');
    setEditCode('');
  };

  const saveEdit = async () => {
    if (!editing || saving) return;

    if (!editName.trim() || !editCode.trim()) {
      showToast('Please enter Subject Name and Subject Code.', { type: 'info' });
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.put<SubjectItem>(`/api/admin/subjects/${editing.id}`, {
        name: editName.trim(),
        subjectCode: editCode.trim().toUpperCase()
      });

      setSubjects((prev) => prev.map((item) => (item.id === editing.id ? { ...item, name: data.name, subjectCode: data.subjectCode } : item)));
      showToast('Subject updated successfully.', { type: 'success' });
      closeEdit(true);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      showToast(e?.response?.data?.message ?? 'Unable to update subject.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (item: SubjectItem) => {
    if (deletingId !== null) return;
    setPendingDelete(item);
  };

  const closeDeleteDialog = () => {
    if (deletingId !== null) return;
    setPendingDelete(null);
  };

  const deleteSubject = async () => {
    if (!pendingDelete || deletingId !== null) return;
    try {
      setDeletingId(pendingDelete.id);
      await api.delete(`/api/admin/subjects/${pendingDelete.id}`);
      const next = subjects.filter((item) => item.id !== pendingDelete.id);
      setSubjects(next);
      showToast('Subject deleted successfully.', { type: 'success' });
      setPendingDelete(null);
      if (next.length === 0) {
        navigation.goBack();
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        showToast('Session expired. Please login again.', { type: 'error' });
        await logout();
        return;
      }
      if (status === 404) {
        const next = subjects.filter((item) => item.id !== pendingDelete.id);
        setSubjects(next);
        setPendingDelete(null);
        showToast('Subject already deleted. List refreshed.', { type: 'info' });
        if (next.length === 0) {
          navigation.goBack();
        }
        return;
      }
      showToast(e?.response?.data?.message ?? 'Unable to delete subject.', { type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{branch} - Semester {semester}</Text>
      <FlatList
        data={sortedSubjects}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadingFailed ? 'Unable to load subjects right now. Please try again.' : 'No subjects found.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>Code: {item.subjectCode}</Text>
            <Button mode="outlined" style={styles.editBtn} contentStyle={buttonStyles.content} onPress={() => openEdit(item)}>
              Edit
            </Button>
            <Button
              mode="outlined"
              style={styles.deleteBtn}
              contentStyle={buttonStyles.content}
              textColor={colors.danger}
              onPress={() => askDelete(item)}
              disabled={deletingId === item.id}
              loading={deletingId === item.id}
            >
              Delete
            </Button>
          </Surface>
        )}
      />
      <Portal>
        <Dialog visible={!!editing} onDismiss={() => closeEdit()} style={styles.dialog}>
          <Dialog.Title>Edit Subject</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Subject Name"
              mode="outlined"
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              autoCorrect={false}
            />
            <TextInput
              key={`subject-code-${editing?.id ?? 'new'}`}
              label="Subject Code"
              mode="outlined"
              style={styles.input}
              defaultValue={editCode}
              onChangeText={setEditCode}
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="characters"
              autoComplete="off"
              importantForAutofill="no"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => closeEdit()} disabled={saving}>Cancel</Button>
            <Button onPress={saveEdit} loading={saving} disabled={saving}>Save</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={!!pendingDelete} onDismiss={closeDeleteDialog} style={styles.dialog}>
          <Dialog.Title>Delete Subject</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.confirmText}>
              Delete "{pendingDelete?.name}" ({pendingDelete?.subjectCode})?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDeleteDialog} disabled={deletingId !== null}>Cancel</Button>
            <Button
              onPress={deleteSubject}
              textColor={colors.danger}
              loading={deletingId !== null}
              disabled={deletingId !== null}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 8,
    padding: 12
  },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, marginTop: 4 },
  editBtn: { marginTop: 8, alignSelf: 'flex-start' },
  deleteBtn: { marginTop: 8, alignSelf: 'flex-start' },
  dialog: { backgroundColor: colors.card },
  input: { marginBottom: 10, backgroundColor: colors.card },
  empty: { marginTop: 18, textAlign: 'center', color: colors.textMuted },
  confirmText: { color: colors.text }
});
