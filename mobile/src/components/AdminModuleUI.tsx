import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { IconKind, IconMark } from './AcropolisUI';
import { type AppThemeTokens, useAppTheme } from '../styles/appTheme';

export type AdminTone = 'blue' | 'indigo' | 'green' | 'amber' | 'rose';

type SegmentItem<T extends string> = {
  key: T;
  label: string;
};

const toneColor = (theme: AppThemeTokens, tone: AdminTone) => {
  if (tone === 'green') return theme.green;
  if (tone === 'rose') return theme.rose;
  if (tone === 'amber') return theme.goldDeep;
  if (tone === 'indigo') return theme.isDark ? '#A5B4FC' : '#4F46E5';
  return theme.blue;
};

const toneSoft = (theme: AppThemeTokens, tone: AdminTone) => {
  if (tone === 'green') return theme.greenSoft;
  if (tone === 'rose') return theme.roseSoft;
  if (tone === 'amber') return theme.amberSoft;
  if (tone === 'indigo') return theme.isDark ? '#1B2142' : '#EEF2FF';
  return theme.blueSoft;
};

const toneBorder = (theme: AppThemeTokens, tone: AdminTone) => {
  if (tone === 'green') return theme.isDark ? '#145A42' : '#A7F3D0';
  if (tone === 'rose') return theme.isDark ? '#6B2132' : '#FECACA';
  if (tone === 'amber') return theme.isDark ? '#5F481B' : '#FDE68A';
  if (tone === 'indigo') return theme.isDark ? '#303A73' : '#C7D2FE';
  return theme.isDark ? '#1D4D80' : '#DBEAFE';
};

export const AdminCard = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  return <View style={[adminStyles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, style]}>{children}</View>;
};

export const AdminFormCard = ({ title, helper, children, style }: { title: string; helper?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  return (
    <AdminCard style={[adminStyles.formCard, style]}>
      <View style={[adminStyles.formHeader, { borderBottomColor: theme.border }]}> 
        <Text style={[adminStyles.formHeaderTitle, { color: theme.goldDeep }]}>{title}</Text>
        {helper ? <Text style={[adminStyles.formHeaderHelper, { color: theme.muted }]}>{helper}</Text> : null}
      </View>
      <View style={adminStyles.formBody}>{children}</View>
    </AdminCard>
  );
};

export const AdminSearchInput = ({ value, onChangeText, placeholder, style }: { value: string; onChangeText: (value: string) => void; placeholder: string; style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  return (
    <View style={[adminStyles.searchWrap, { backgroundColor: theme.input, borderColor: theme.border }, style]}>
      <Text style={[adminStyles.searchIcon, { color: theme.ghost }]}>S</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.ghost}
        style={[adminStyles.searchInput, { color: theme.ink }]}
        autoCorrect={false}
      />
    </View>
  );
};

export const AdminTextField = ({ label, style, inputStyle, ...props }: Omit<TextInputProps, 'style'> & { label: string; style?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle> }) => {
  const theme = useAppTheme();
  return (
    <View style={style}>
      <Text style={[adminStyles.fieldLabel, { color: theme.goldDeep }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.ghost}
        style={[adminStyles.textInput, { backgroundColor: theme.input, borderColor: theme.border, color: theme.ink }, inputStyle]}
      />
    </View>
  );
};

export const AdminPickerFrame = ({ label, children, style }: { label: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  return (
    <View style={[adminStyles.pickerFrame, { backgroundColor: theme.input, borderColor: theme.border }, style]}>
      <Text style={[adminStyles.fieldLabel, { color: theme.goldDeep }]}>{label}</Text>
      <View style={adminStyles.pickerInner}>{children}</View>
    </View>
  );
};

export const AdminPrimaryButton = ({ label, onPress, disabled, loading, tone = 'blue', style }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; tone?: AdminTone; style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  const color = toneColor(theme, tone);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        adminStyles.primaryButton,
        { backgroundColor: color, shadowColor: color },
        (disabled || loading) && adminStyles.disabled,
        pressed && !(disabled || loading) && adminStyles.pressed,
        style
      ]}
    >
      <Text style={adminStyles.primaryButtonText}>{loading ? 'Please wait...' : label}</Text>
    </Pressable>
  );
};

export const AdminOutlineButton = ({ label, onPress, disabled, tone = 'blue', style }: { label: string; onPress: () => void; disabled?: boolean; tone?: AdminTone; style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  const color = toneColor(theme, tone);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        adminStyles.outlineButton,
        { backgroundColor: toneSoft(theme, tone), borderColor: toneBorder(theme, tone) },
        disabled && adminStyles.disabled,
        pressed && !disabled && adminStyles.pressed,
        style
      ]}
    >
      <Text style={[adminStyles.outlineButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
};

export const AdminIconAction = ({ label, onPress, tone = 'blue', disabled }: { label: string; onPress: () => void; tone?: AdminTone; disabled?: boolean }) => {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        adminStyles.iconAction,
        { backgroundColor: toneSoft(theme, tone) },
        disabled && adminStyles.disabled,
        pressed && !disabled && adminStyles.pressed
      ]}
    >
      <Text style={[adminStyles.iconActionText, { color: toneColor(theme, tone) }]}>{label}</Text>
    </Pressable>
  );
};

export const AdminSegmentedTabs = <T extends string>({ items, active, onChange }: { items: SegmentItem<T>[]; active: T; onChange: (key: T) => void }) => {
  const theme = useAppTheme();
  return (
    <View style={[adminStyles.tabsBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}> 
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={[adminStyles.tab, isActive && { backgroundColor: theme.blue, shadowColor: theme.blue }]}> 
            <Text style={[adminStyles.tabText, { color: isActive ? '#FFFFFF' : theme.muted }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const AdminListCard = ({ iconKind, tone = 'blue', title, meta, caption, right, onPress }: { iconKind: IconKind; tone?: AdminTone; title: string; meta?: string; caption?: string; right?: React.ReactNode; onPress?: () => void }) => {
  const theme = useAppTheme();
  const content = (
    <>
      <IconMark kind={iconKind} tone={tone} size={44} />
      <View style={adminStyles.listCopy}>
        <Text style={[adminStyles.listTitle, { color: theme.ink }]} numberOfLines={1}>{title}</Text>
        {meta ? <Text style={[adminStyles.listMeta, { color: theme.muted }]} numberOfLines={1}>{meta}</Text> : null}
        {caption ? <Text style={[adminStyles.listCaption, { color: theme.ghost }]} numberOfLines={1}>{caption}</Text> : null}
      </View>
      {right ?? <Text style={[adminStyles.chevron, { color: theme.ghost }]}>{'>'}</Text>}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [adminStyles.listCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && adminStyles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[adminStyles.listCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>{content}</View>;
};

export const AdminStatTile = ({ label, value, tone = 'blue' }: { label: string; value: string | number; tone?: AdminTone }) => {
  const theme = useAppTheme();
  return (
    <View style={[adminStyles.statTile, { backgroundColor: theme.card, borderColor: theme.border }]}> 
      <Text style={[adminStyles.statValue, { color: toneColor(theme, tone) }]}>{value}</Text>
      <Text style={[adminStyles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
};

export const AdminEmpty = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const theme = useAppTheme();
  return (
    <View style={[adminStyles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}> 
      <Text style={[adminStyles.emptyIcon, { color: theme.ghost }]}>i</Text>
      <Text style={[adminStyles.emptyTitle, { color: theme.ink }]}>{title}</Text>
      {subtitle ? <Text style={[adminStyles.emptySubtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
    </View>
  );
};

export const adminStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E0',
    borderRadius: 22,
    shadowColor: '#1C1917',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  formCard: { overflow: 'hidden' },
  formHeader: { paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  formHeaderTitle: { color: '#6B7280', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  formHeaderHelper: { color: '#8B8070', fontSize: 12, fontWeight: '700', marginTop: 3 },
  formBody: { padding: 16, gap: 12 },
  fieldLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  textInput: { minHeight: 50, borderWidth: 1, borderColor: '#EDE8E0', borderRadius: 14, backgroundColor: '#F9FAFB', color: '#1C1917', paddingHorizontal: 14, fontSize: 14, fontWeight: '700' },
  searchWrap: { minHeight: 50, borderWidth: 1, borderColor: '#EDE8E0', borderRadius: 15, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchIcon: { color: '#A09890', fontSize: 20, fontWeight: '900', marginRight: 8 },
  searchInput: { flex: 1, color: '#1C1917', fontSize: 14, fontWeight: '700', paddingVertical: 8 },
  pickerFrame: { borderWidth: 1, borderColor: '#EDE8E0', borderRadius: 14, backgroundColor: '#F9FAFB', paddingTop: 10, paddingHorizontal: 12, overflow: 'hidden' },
  pickerInner: { marginHorizontal: -12, marginTop: -3 },
  primaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  outlineButton: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: '#DBEAFE', backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  outlineButtonText: { color: '#2563EB', fontSize: 12, fontWeight: '900' },
  iconAction: { minWidth: 42, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  iconActionText: { fontSize: 11, fontWeight: '900' },
  tabsBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EDE8E0', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9 },
  tabText: { color: '#8B8070', fontSize: 12, fontWeight: '900' },
  listCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E0', borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  listCopy: { flex: 1, minWidth: 0 },
  listTitle: { color: '#1C1917', fontSize: 14, fontWeight: '900' },
  listMeta: { color: '#8B8070', fontSize: 11, fontWeight: '700', marginTop: 3 },
  listCaption: { color: '#A09890', fontSize: 10, fontWeight: '700', marginTop: 2 },
  chevron: { color: '#D1D5DB', fontSize: 22, fontWeight: '900' },
  statTile: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E0', borderRadius: 18, padding: 13, alignItems: 'center' },
  statValue: { color: '#2563EB', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#8B8070', fontSize: 11, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE8E0', marginTop: 12 },
  emptyIcon: { color: '#D1D5DB', fontSize: 34, fontWeight: '900' },
  emptyTitle: { color: '#1C1917', fontSize: 15, fontWeight: '900', marginTop: 8 },
  emptySubtitle: { color: '#8B8070', marginTop: 4, textAlign: 'center', fontSize: 12 },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
