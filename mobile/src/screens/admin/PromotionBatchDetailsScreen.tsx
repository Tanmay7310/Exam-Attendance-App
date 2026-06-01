import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api/client';
import { ACR, AcropolisBackBar, HeroCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';
import { AdminEmpty, AdminListCard, AdminPrimaryButton, AdminStatTile } from '../../components/AdminModuleUI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudentPromotionBatchDetail, StudentPromotionItem, StudentPromotionRollbackResponse } from '../../types';
import { getApiErrorMessage, handleSessionExpired } from '../../utils/apiErrors';

const rowColorByStatus = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized.includes('FAILED')) return ACR.rose;
  if (normalized.includes('SKIPPED')) return '#D97706';
  if (normalized.includes('ROLLED_BACK')) return '#0F766E';
  return ACR.blue;
};

export const PromotionBatchDetailsScreen = ({ route, navigation }: any) => {
  const batchId = Number(route?.params?.batchId);
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [details, setDetails] = useState<StudentPromotionBatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

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
      if (await handleSessionExpired(error, logout, showToast)) return;
      showToast(getApiErrorMessage(error, 'Unable to load batch details.'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [batchId, logout, showToast]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  const rollback = async () => {
    if (!batchId) return;
    try {
      setRollingBack(true);
      const { data } = await api.post<StudentPromotionRollbackResponse>(`/api/admin/students/promotions/${batchId}/rollback`);
      showToast(`Rollback finished. Rolled back: ${data.rolledBack}, Failed: ${data.failed}`, { type: data.failed > 0 ? 'info' : 'success', duration: 3200 });
      await loadDetails();
    } catch (error: any) {
      if (await handleSessionExpired(error, logout, showToast)) return;
      showToast(getApiErrorMessage(error, 'Unable to rollback this batch.'), { type: 'error' });
    } finally {
      setRollingBack(false);
    }
  };

  const sortedItems = useMemo(() => [...(details?.items ?? [])].sort((a, b) => a.studentName.localeCompare(b.studentName)), [details?.items]);
  const batch = details?.batch;

  const renderItem = ({ item }: { item: StudentPromotionItem }) => (
    <AdminListCard
      iconKind="student"
      tone="indigo"
      title={item.studentName}
      meta={`Scholar: ${item.scholarNumber} | Enrol: ${item.enrollmentNumber}`}
      caption={`From Y${item.fromYear} S${item.fromSemester} to Y${item.toYear} S${item.toSemester}`}
      right={<Text style={[styles.status, { color: rowColorByStatus(item.status) }]}>{item.status}</Text>}
    />
  );

  return (
    <ScreenShell>
      <AcropolisBackBar title="Promotion Batch" subtitle={batch ? `Batch #${batch.id}` : 'Details'} onBack={() => navigation.goBack()} />
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {batch ? (
              <HeroCard>
                <Text style={styles.heroKicker}>Batch Summary</Text>
                <Text style={styles.heroTitle}>#{batch.id} | {batch.status}</Text>
                <Text style={styles.heroMeta}>By {batch.promotedBy} | {new Date(batch.promotedAt).toLocaleString()}</Text>
              </HeroCard>
            ) : null}
            {batch ? (
              <View style={styles.statsRow}>
                <AdminStatTile label="Promoted" value={batch.promotedCount} tone="green" />
                <AdminStatTile label="Skipped" value={batch.skippedCount} tone="amber" />
                <AdminStatTile label="Failed" value={batch.failedCount} tone="rose" />
              </View>
            ) : null}
            <View style={styles.actionsRow}>
              <View style={styles.actionButton}><AdminPrimaryButton label={loading ? 'Refreshing...' : 'Refresh'} onPress={loadDetails} disabled={loading || rollingBack} /></View>
              <View style={styles.actionButton}><AdminPrimaryButton label={rollingBack ? 'Rolling back...' : 'Rollback Batch'} tone="rose" onPress={rollback} disabled={rollingBack || !batch} /></View>
            </View>
            <SectionLabel title="Students" />
          </>
        }
        renderItem={renderItem}
        ListEmptyComponent={<AdminEmpty title="No promotion items found" subtitle="Refresh if this batch was just created." />}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroKicker: { color: ACR.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 5 },
  heroMeta: { color: '#BFD1FF', fontSize: 12, fontWeight: '700', marginTop: 5 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionButton: { flex: 1 },
  status: { fontSize: 10, fontWeight: '900', maxWidth: 90, textAlign: 'right' }
});
