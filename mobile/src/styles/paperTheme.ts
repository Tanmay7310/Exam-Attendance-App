import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { appThemes, type ThemeMode, type AppThemeTokens } from './appTheme';

const createPaperTheme = (tokens: AppThemeTokens, base: MD3Theme): MD3Theme => ({
  ...base,
  roundness: 12,
  colors: {
    ...base.colors,
    primary: tokens.blue,
    secondary: tokens.royal,
    surface: tokens.card,
    surfaceVariant: tokens.cardAlt,
    background: tokens.bg,
    error: tokens.rose,
    onPrimary: '#FFFFFF',
    onSurface: tokens.ink,
    onBackground: tokens.ink,
    outline: tokens.border
  }
});

export const lightPaperTheme = createPaperTheme(appThemes.light, MD3LightTheme);
export const darkPaperTheme = createPaperTheme(appThemes.dark, MD3DarkTheme);

export const getPaperTheme = (mode: ThemeMode) => (mode === 'dark' ? darkPaperTheme : lightPaperTheme);
