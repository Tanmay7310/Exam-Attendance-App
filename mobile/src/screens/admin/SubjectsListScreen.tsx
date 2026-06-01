import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminIconAction, AdminListCard, AdminSearchInput } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SubjectItem } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

export const SubjectsListScreen = ({ route, navigation }: any) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const branch: string = route?.params?.branch ?? '';
  const semester: string = route?.params?.semester ?? '';
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SubjectItem | null>(null);

  const loadSubjects = React.useCallback(async () => {
    const { data } = await api.get<SubjectItem[]>('/api/admin/subjects');
    const filtered = data.filter(
      (item) => item.branch.trim().toLowerCase() === branch.trim().toLowerCase() && item.semester.trim() === semester.trim()
    );
    setSubjects(filtered);
    setLoadingFailed(false);
  }, [branch, semester]);

  React.useEffect(() => {
    const runLoad = () => {
      loadSubjects().catch(async (e: any) => {
        if (await handleSessionExpired(e, logout, showToast)) return;
        setLoadingFailed(true);
        showToast(getApiErrorMessage(e, 'Unable to load subjects.'), { type: 'error' });
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
    const q = search.trim().toLowerCase();
    return [...subjects]
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.subjectCode.toLowerCase().includes(q))
      .sort((a, b) => {
        const byLastDigit = getLastCodeDigit(a.subjectCode) - getLastCodeDigit(b.subjectCode);
        if (byLastDigit !== 0) return byLastDigit;
        const byCode = a.subjectCode.localeCompare(b.subjectCode);
        if (byCode !== 0) return byCode;
        return a.name.localeCompare(b.name);
      });
  }, [subjects, search]);

  const openEdit = (item: SubjectItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditCode(item.subjectCode);
  };

  const closeEdit = (force = false) => {
    if (saving && !force) return;
    setEditing(null); setEditName(''); setEditCode('');
  };

  const saveEdit = async () => {
    if (!editing || saving) return;
    if (!editName.trim() || !editCode.trim()) {
      showToast('Please enter Subject Name and Subject Code.', { type: 'info' });
      return;
    }
    try {
      setSaving(true);
      const { data } = await api.put<SubjectItem>(`/api/admin/subjects/${editing.id}`, { name: editName.trim(), subjectCode: editCode.trim().toUpperCase() });
      setSubjects((prev) => prev.map((item) => (item.id === editing.id ? { ...item, name: data.name, subjectCode: data.subjectCode } : item)));
      showToast('Subject updated successfully.', { type: 'success' });
      closeEdit(true);
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      showToast(getApiErrorMessage(e, 'Unable to update subject.'), { type: 'error' });
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
      if (next.length === 0) navigation.goBack();
    } catch (e: any) {
      if (await handleSessionExpired(e, logout, showToast)) return;
      if (e?.response?.status === 404) {
        const next = subjects.filter((item) => item.id !== pendingDelete.id);
        setSubjects(next);
        setPendingDelete(null);
        showToast('Subject already deleted. List refreshed.', { type: 'info' });
        if (next.length === 0) navigation.goBack();
        return;
      }
      showToast(getApiErrorMessage(e, 'Unable to delete subject.'), { type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ScreenShell>
      <AcropolisBackBar title={`Semester ${semester}`} subtitle={branch || 'Subjects'} onBack={() => navigation.goBack()} />
      <FlatList
        data={sortedSubjects}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {subjects.length > 0 ? <AdminSearchInput value={search} onChangeText={setSearch} placeholder="Search subject name or code" /> : null}
            <SectionLabel title={search.trim() ? `Results (${sortedSubjects.length})` : `Subjects (${subjects.length})`} />
          </>
        }
        ListEmptyComponent={<AdminEmpty title={loadingFailed ? 'Unable to load subjects' : 'No subjects found'} subtitle={loadingFailed ? 'Try opening this screen again.' : 'This semester has no assigned subjects.'} />}
        renderItem={({ item }) => (
          <AdminListCard
            iconKind="book"
            tone="amber"
            title={item.name}
            meta={`Code: ${item.subjectCode}`}
            right={
              <View style={styles.actions}>
                <AdminIconAction label="Edit" tone="blue" onPress={() => openEdit(item)} />
                <AdminIconAction label={deletingId === item.id ? '...' : 'Delete'} tone="rose" onPress={() => askDelete(item)} disabled={deletingId === item.id} />
              </View>
            }
          />
        )}
      />
      <Portal>
        {editing ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.portalKeyboard}
            pointerEvents="box-none"
          >
            <Dialog visible onDismiss={() => closeEdit()} style={styles.dialog}>
              <Dialog.Title>Edit Subject</Dialog.Title>
              <Dialog.Content>
                <TextInput label="Subject Name" mode="outlined" style={styles.input} value={editName} onChangeText={setEditName} autoCorrect={false} />
                <TextInput
                  key={`subject-code-${editing.id}`}
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
          </KeyboardAvoidingView>
        ) : null}
        <Dialog visible={!!pendingDelete} onDismiss={closeDeleteDialog} style={styles.dialog}>
          <Dialog.Title>Delete Subject</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.confirmText}>Delete "{pendingDelete?.name}" ({pendingDelete?.subjectCode})?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDeleteDialog} disabled={deletingId !== null}>Cancel</Button>
            <Button onPress={deleteSubject} textColor={ACR.rose} loading={deletingId !== null} disabled={deletingId !== null}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  actions: { flexDirection: 'row', gap: 6 },
  dialog: { backgroundColor: '#FFFFFF', borderRadius: 24 },
  portalKeyboard: { flex: 1, justifyContent: 'center' },
  input: { marginBottom: 10, backgroundColor: '#FFFFFF' },
  confirmText: { color: ACR.ink, fontWeight: '700' }
});
