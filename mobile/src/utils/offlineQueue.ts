import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import type { Role } from '../types';

type OfflineScanPayload = {
  scholarNumber: string;
  examSubject: string;
  examYear: string;
  examSemester: string;
  examBranch: string;
  examSection: string;
  caseSensitive: boolean;
};

type OfflineScanItem = {
  id: string;
  createdAt: string;
  username?: string;
  role: Role;
  endpoint: string;
  payload: OfflineScanPayload;
};

type FlushAuth = {
  username?: string;
  role?: Role;
} | null | undefined;

const QUEUE_KEY = 'attendance_offline_queue';

const loadQueue = async () => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [] as OfflineScanItem[];
  try {
    const parsed = JSON.parse(raw) as OfflineScanItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as OfflineScanItem[];
  }
};

const saveQueue = async (queue: OfflineScanItem[]) => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const getOfflineQueueSize = async () => {
  const queue = await loadQueue();
  return queue.length;
};

export const enqueueOfflineScan = async (item: OfflineScanItem) => {
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
  return queue.length;
};

const belongsToCurrentUser = (item: OfflineScanItem, currentAuth: FlushAuth) =>
  Boolean(currentAuth?.username && currentAuth?.role)
  && item.username === currentAuth?.username
  && item.role === currentAuth?.role;

export const flushOfflineScans = async (currentAuth?: FlushAuth) => {
  const queue = await loadQueue();
  if (queue.length === 0) {
    return { sent: 0, remaining: 0, dropped: 0, skipped: 0 };
  }

  const authHeader = api.defaults.headers.common.Authorization;
  if (!authHeader || !currentAuth?.username || !currentAuth?.role) {
    return { sent: 0, remaining: queue.length, dropped: 0, skipped: queue.length };
  }

  const remaining: OfflineScanItem[] = [];
  let sent = 0;
  let dropped = 0;
  let skipped = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
    if (!belongsToCurrentUser(item, currentAuth)) {
      remaining.push(item);
      skipped += 1;
      continue;
    }

    try {
      await api.post(item.endpoint, item.payload);
      sent += 1;
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        remaining.push(item, ...queue.slice(index + 1));
        break;
      }

      const isNetworkError = !e?.response;
      if (isNetworkError) {
        remaining.push(item, ...queue.slice(index + 1));
        break;
      }

      if (status && status >= 500) {
        remaining.push(item);
      }
      if (status && status >= 400 && status < 500) {
        dropped += 1;
      }
    }
  }

  await saveQueue(remaining);
  return { sent, remaining: remaining.length, dropped, skipped };
};

export const createOfflineScanItem = (
  role: Role,
  payload: OfflineScanPayload,
  username?: string
): OfflineScanItem => {
  const endpoint = role === 'ADMIN' ? '/api/admin/attendance/scan' : '/api/teacher/attendance/scan';
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
    username,
    role,
    endpoint,
    payload
  };
};

export const isOfflineError = (e: any) => {
  if (e?.response) return false;
  const message = String(e?.message ?? '').toLowerCase();
  return message.includes('network') || message.includes('timeout') || message.includes('failed') || message.includes('offline');
};
