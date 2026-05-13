import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';
import { StudentPromotionBatchDetail, StudentPromotionItem, StudentPromotionRollbackResponse } from '../../types';

const rowColorByStatus = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized.includes('FAILED')) return colors.danger;
  if (normalized.includes('SKIPPED')) return '#9A6A00';
  if (normalized.includes('ROLLED_BACK')) return '#0F766E';
  return colors.accentDark;
};

export const PromotionBatchDetailsScreen = ({ route }: any) => {
  const batchId = Number(route?.params?.batchId);
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [details, setDetails] = useState<StudentPromotionBatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const handleAuthError = useCallback(async (error: any) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      showToast('Session expired. Please login again.', { type: 'error' });
      await logout();
      return true;
    }
    return false;
  }, [logout, showToast]);

  const loadDetails = useCallback(async () => {
    if (!batchId) {
      showToast('Invalid promotion batch.', { type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get<StudentPromotionBatchDetail>(`/api/admin/students/promotions/${batchId}`);
      setDetails(data);
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(error?.response?.data?.message ?? 'Unable to load batch details.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [batchId, handleAuthError, showToast]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const rollback = async () => {
    if (!batchId) return;
    try {
      setRollingBack(true);
      const { data } = await api.post<StudentPromotionRollbackResponse>(`/api/admin/students/promotions/${batchId}/rollback`);
      showToast(`Rollback finished. Rolled back: ${data.rolledBack}, Failed: ${data.failed}`, {
        type: data.failed > 0 ? 'info' : 'success',
        duration: 3200
      });
      await loadDetails();
    } catch (error: any) {
      if (await handleAuthError(error)) return;
      showToast(error?.response?.data?.message ?? 'Unable to rollback this batch.', { type: 'error' });
    } finally {
      setRollingBack(false);
    }
  };

  const sortedItems = useMemo(() => {
    const items = details?.items ?? [];
    return [...items].sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [details?.items]);

  const renderItem = ({ item }: { item: StudentPromotionItem }) => (
    <Surface style={styles.card} elevation={1}>
      <Text style={styles.name}>{item.studentName}</Text>
      <Text style={styles.meta}>Enrollment: {item.enrollmentNumber}</Text>
      <Text style={styles.meta}>Scholar: {item.scholarNumber}</Text>
      <Text style={styles.meta}>From: Y{item.fromYear} S{item.fromSemester} | {item.fromBranch} | Sec {item.fromSection}</Text>
      <Text style={styles.meta}>To: Y{item.toYear} S{item.toSemester} | {item.toBranch} | Sec {item.toSection}</Text>
      <Text style={[styles.status, { color: rowColorByStatus(item.status) }]}>Status: {item.status}</Text>
      {item.reason ? <Text style={styles.reason}>Reason: {item.reason}</Text> : null}
    </Surface>
  );

  return (
    <View style={styles.container}>
      {details?.batch ? (
        <Surface style={styles.summaryCard} elevation={1}>
          <Text style={styles.summaryTitle}>Batch #{details.batch.id}</Text>
          <Text style={styles.meta}>Status: {details.batch.status}</Text>
          <Text style={styles.meta}>From: Y{details.batch.fromYear} S{details.batch.fromSemester} | {details.batch.fromBranch} | Sec {details.batch.fromSection}</Text>
          <Text style={styles.meta}>To: Y{details.batch.toYear} S{details.batch.toSemester} | {details.batch.toBranch} | Sec {details.batch.toSection}</Text>
          <Text style={styles.meta}>Promoted: {details.batch.promotedCount}, Skipped: {details.batch.skippedCount}, Failed: {details.batch.failedCount}</Text>
          <Button
            mode="contained"
            buttonColor={colors.danger}
            style={styles.rollbackButton}
            contentStyle={buttonStyles.content}
            onPress={rollback}
            loading={rollingBack}
            disabled={rollingBack}
          >
            Rollback Batch
          </Button>
        </Surface>
      ) : null}

      <Button mode="contained-tonal" style={styles.refreshButton} contentStyle={buttonStyles.content} onPress={loadDetails} loading={loading}>
        Refresh Details
      </Button>

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No promotion items found for this batch.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  summaryTitle: { color: colors.text, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.textMuted, marginTop: 2 },
  rollbackButton: { marginTop: 10, borderRadius: 10 },
  refreshButton: { borderRadius: 10 },
  list: { marginTop: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  name: { color: colors.text, fontWeight: '700' },
  status: { marginTop: 4, fontWeight: '700' },
  reason: { color: colors.textMuted, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 16 }
});
