import React, { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export type AppThemeTokens = {
  mode: ThemeMode;
  isDark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  input: string;
  border: string;
  ink: string;
  muted: string;
  ghost: string;
  royal: string;
  royalDark: string;
  headerSubtle: string;
  blue: string;
  blueSoft: string;
  gold: string;
  goldDeep: string;
  amberSoft: string;
  green: string;
  greenSoft: string;
  rose: string;
  roseSoft: string;
  shadow: string;
};

export const lightThemeTokens: AppThemeTokens = {
  mode: 'light',
  isDark: false,
  bg: '#F9F7F4',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',
  input: '#F9FAFB',
  border: '#EDE8E0',
  ink: '#1C1917',
  muted: '#8B8070',
  ghost: '#A09890',
  royal: '#1E3A8A',
  royalDark: '#172F73',
  headerSubtle: '#BFD1FF',
  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  gold: '#D4AF37',
  goldDeep: '#C4A35A',
  amberSoft: '#FFFBEB',
  green: '#059669',
  greenSoft: '#ECFDF5',
  rose: '#B91C1C',
  roseSoft: '#FEF2F2',
  shadow: '#1C1917'
};

export const darkThemeTokens: AppThemeTokens = {
  mode: 'dark',
  isDark: true,
  bg: '#0B1220',
  card: '#111827',
  cardAlt: '#172033',
  input: '#162033',
  border: '#263145',
  ink: '#F8FAFC',
  muted: '#CBD5E1',
  ghost: '#94A3B8',
  royal: '#1E3A8A',
  royalDark: '#111F4F',
  headerSubtle: '#D8E2FF',
  blue: '#60A5FA',
  blueSoft: '#102A4C',
  gold: '#F5C84B',
  goldDeep: '#E2B84A',
  amberSoft: '#2D2412',
  green: '#34D399',
  greenSoft: '#0F2C23',
  rose: '#FB7185',
  roseSoft: '#351722',
  shadow: '#000000'
};

export const appThemes: Record<ThemeMode, AppThemeTokens> = {
  light: lightThemeTokens,
  dark: darkThemeTokens
};

const AppThemeContext = createContext<AppThemeTokens>(lightThemeTokens);

export const AppThemeProvider = ({ tokens, children }: { tokens: AppThemeTokens; children: React.ReactNode }) => (
  <AppThemeContext.Provider value={tokens}>{children}</AppThemeContext.Provider>
);

export const useAppTheme = () => useContext(AppThemeContext);
