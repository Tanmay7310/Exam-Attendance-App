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
  role: Role;
  endpoint: string;
  payload: OfflineScanPayload;
};

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

export const flushOfflineScans = async () => {
  const queue = await loadQueue();
  if (queue.length === 0) {
    return { sent: 0, remaining: 0, dropped: 0 };
  }

  const authHeader = api.defaults.headers.common.Authorization;
  if (!authHeader) {
    return { sent: 0, remaining: queue.length, dropped: 0 };
  }

  const remaining: OfflineScanItem[] = [];
  let sent = 0;
  let dropped = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];
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
  return { sent, remaining: remaining.length, dropped };
};

export const createOfflineScanItem = (
  role: Role,
  payload: OfflineScanPayload
): OfflineScanItem => {
  const endpoint = role === 'ADMIN' ? '/api/admin/attendance/scan' : '/api/teacher/attendance/scan';
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    createdAt: new Date().toISOString(),
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
