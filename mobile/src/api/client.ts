import axios from 'axios';
import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

const getHostFromScriptUrl = () => {
  const scriptUrl: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptUrl) return undefined;

  const match = scriptUrl.match(/^https?:\/\/([^/:]+)/i);
  return match?.[1];
};

const getHostFromExpoGoDebugger = () => {
  const debuggerHost = (Constants as any)?.expoGoConfig?.debuggerHost as string | undefined;
  return debuggerHost?.split(':')[0];
};

const isLocalOrPrivateHost = (host?: string) => {
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1') return true;

  // LAN/private IPv4 ranges commonly used during development.
  if (host.startsWith('10.')) return true;
  if (host.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
};

const resolveApiBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured;

  const scriptHost = getHostFromScriptUrl();
  if (isLocalOrPrivateHost(scriptHost)) return `http://${scriptHost}:8080`;

  const debuggerHost = getHostFromExpoGoDebugger();
  if (isLocalOrPrivateHost(debuggerHost)) return `http://${debuggerHost}:8080`;

  // In Expo Go, hostUri is usually like "10.176.37.41:8081".
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (isLocalOrPrivateHost(host)) return `http://${host}:8080`;

  // Final fallback for local simulator/emulator-based development.
  return 'http://localhost:8080';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
