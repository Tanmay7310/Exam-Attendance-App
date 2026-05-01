import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { colors } from './theme';

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.card,
    surfaceVariant: colors.bg,
    background: colors.bg,
    error: colors.danger,
    onPrimary: '#FFFFFF',
    onSurface: colors.text,
    onBackground: colors.text,
    outline: colors.border
  }
};
