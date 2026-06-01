import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { ACR, IconKind, IconMark } from './AcropolisUI';

export type AdminTone = 'blue' | 'indigo' | 'green' | 'amber' | 'rose';

type SegmentItem<T extends string> = {
  key: T;
  label: string;
};

export const AdminCard = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[adminStyles.card, style]}>{children}</View>
);

export const AdminFormCard = ({ title, helper, children, style }: { title: string; helper?: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <AdminCard style={[adminStyles.formCard, style]}>
    <View style={adminStyles.formHeader}>
      <Text style={adminStyles.formHeaderTitle}>{title}</Text>
      {helper ? <Text style={adminStyles.formHeaderHelper}>{helper}</Text> : null}
    </View>
    <View style={adminStyles.formBody}>{children}</View>
  </AdminCard>
);

export const AdminSearchInput = ({ value, onChangeText, placeholder, style }: { value: string; onChangeText: (value: string) => void; placeholder: string; style?: StyleProp<ViewStyle> }) => (
  <View style={[adminStyles.searchWrap, style]}>
    <Text style={adminStyles.searchIcon}>S</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={ACR.ghost}
      style={adminStyles.searchInput}
      autoCorrect={false}
    />
  </View>
);

export const AdminTextField = ({ label, style, inputStyle, ...props }: Omit<TextInputProps, 'style'> & { label: string; style?: StyleProp<ViewStyle>; inputStyle?: StyleProp<TextStyle> }) => (
  <View style={style}>
    <Text style={adminStyles.fieldLabel}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor={ACR.ghost}
      style={[adminStyles.textInput, inputStyle]}
    />
  </View>
);

export const AdminPickerFrame = ({ label, children, style }: { label: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[adminStyles.pickerFrame, style]}>
    <Text style={adminStyles.fieldLabel}>{label}</Text>
    <View style={adminStyles.pickerInner}>{children}</View>
  </View>
);

export const AdminPrimaryButton = ({ label, onPress, disabled, loading, tone = 'blue', style }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; tone?: AdminTone; style?: StyleProp<ViewStyle> }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      adminStyles.primaryButton,
      tone === 'green' && adminStyles.primaryGreen,
      tone === 'rose' && adminStyles.primaryRose,
      (disabled || loading) && adminStyles.disabled,
      pressed && !(disabled || loading) && adminStyles.pressed,
      style
    ]}
  >
    <Text style={adminStyles.primaryButtonText}>{loading ? 'Please wait...' : label}</Text>
  </Pressable>
);

export const AdminOutlineButton = ({ label, onPress, disabled, tone = 'blue', style }: { label: string; onPress: () => void; disabled?: boolean; tone?: AdminTone; style?: StyleProp<ViewStyle> }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      adminStyles.outlineButton,
      tone === 'rose' && adminStyles.outlineRose,
      tone === 'green' && adminStyles.outlineGreen,
      disabled && adminStyles.disabled,
      pressed && !disabled && adminStyles.pressed,
      style
    ]}
  >
    <Text style={[adminStyles.outlineButtonText, tone === 'rose' && adminStyles.outlineRoseText, tone === 'green' && adminStyles.outlineGreenText]}>{label}</Text>
  </Pressable>
);

export const AdminIconAction = ({ label, onPress, tone = 'blue', disabled }: { label: string; onPress: () => void; tone?: AdminTone; disabled?: boolean }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [adminStyles.iconAction, toneStyles[tone], disabled && adminStyles.disabled, pressed && !disabled && adminStyles.pressed]}
  >
    <Text style={[adminStyles.iconActionText, toneTextStyles[tone]]}>{label}</Text>
  </Pressable>
);

export const AdminSegmentedTabs = <T extends string>({ items, active, onChange }: { items: SegmentItem<T>[]; active: T; onChange: (key: T) => void }) => (
  <View style={adminStyles.tabsBar}>
    {items.map((item) => {
      const isActive = item.key === active;
      return (
        <Pressable key={item.key} onPress={() => onChange(item.key)} style={[adminStyles.tab, isActive && adminStyles.tabActive]}>
          <Text style={[adminStyles.tabText, isActive && adminStyles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const AdminListCard = ({ iconKind, tone = 'blue', title, meta, caption, right, onPress }: { iconKind: IconKind; tone?: AdminTone; title: string; meta?: string; caption?: string; right?: React.ReactNode; onPress?: () => void }) => {
  const content = (
    <>
      <IconMark kind={iconKind} tone={tone} size={44} />
      <View style={adminStyles.listCopy}>
        <Text style={adminStyles.listTitle} numberOfLines={1}>{title}</Text>
        {meta ? <Text style={adminStyles.listMeta} numberOfLines={1}>{meta}</Text> : null}
        {caption ? <Text style={adminStyles.listCaption} numberOfLines={1}>{caption}</Text> : null}
      </View>
      {right ?? <Text style={adminStyles.chevron}>{'>'}</Text>}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [adminStyles.listCard, pressed && adminStyles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={adminStyles.listCard}>{content}</View>;
};

export const AdminStatTile = ({ label, value, tone = 'blue' }: { label: string; value: string | number; tone?: AdminTone }) => (
  <View style={adminStyles.statTile}>
    <Text style={[adminStyles.statValue, tone === 'green' && adminStyles.statGreen, tone === 'rose' && adminStyles.statRose, tone === 'amber' && adminStyles.statAmber]}>{value}</Text>
    <Text style={adminStyles.statLabel}>{label}</Text>
  </View>
);

export const AdminEmpty = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={adminStyles.emptyBox}>
    <Text style={adminStyles.emptyIcon}>i</Text>
    <Text style={adminStyles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={adminStyles.emptySubtitle}>{subtitle}</Text> : null}
  </View>
);

const toneStyles = StyleSheet.create({
  blue: { backgroundColor: '#EFF6FF' },
  indigo: { backgroundColor: '#EEF2FF' },
  green: { backgroundColor: '#ECFDF5' },
  amber: { backgroundColor: '#FFFBEB' },
  rose: { backgroundColor: '#FEF2F2' }
});

const toneTextStyles = StyleSheet.create({
  blue: { color: ACR.blue },
  indigo: { color: '#4F46E5' },
  green: { color: ACR.green },
  amber: { color: '#D97706' },
  rose: { color: ACR.rose }
});

export const adminStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ACR.border,
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
  formHeaderHelper: { color: ACR.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  formBody: { padding: 16, gap: 12 },
  fieldLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  textInput: { minHeight: 50, borderWidth: 1, borderColor: ACR.border, borderRadius: 14, backgroundColor: '#F9FAFB', color: ACR.ink, paddingHorizontal: 14, fontSize: 14, fontWeight: '700' },
  searchWrap: { minHeight: 50, borderWidth: 1, borderColor: ACR.border, borderRadius: 15, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchIcon: { color: ACR.ghost, fontSize: 20, fontWeight: '900', marginRight: 8 },
  searchInput: { flex: 1, color: ACR.ink, fontSize: 14, fontWeight: '700', paddingVertical: 8 },
  pickerFrame: { borderWidth: 1, borderColor: ACR.border, borderRadius: 14, backgroundColor: '#F9FAFB', paddingTop: 10, paddingHorizontal: 12, overflow: 'hidden' },
  pickerInner: { marginHorizontal: -12, marginTop: -3 },
  primaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', shadowColor: ACR.blue, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryGreen: { backgroundColor: ACR.green, shadowColor: ACR.green },
  primaryRose: { backgroundColor: ACR.rose, shadowColor: ACR.rose },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  outlineButton: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: ACR.blue, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  outlineRose: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  outlineGreen: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  outlineButtonText: { color: ACR.blue, fontSize: 12, fontWeight: '900' },
  outlineRoseText: { color: ACR.rose },
  outlineGreenText: { color: ACR.green },
  iconAction: { minWidth: 42, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  iconActionText: { fontSize: 11, fontWeight: '900' },
  tabsBar: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: ACR.border, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9 },
  tabActive: { backgroundColor: ACR.blue, shadowColor: ACR.blue, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  tabText: { color: ACR.muted, fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#FFFFFF' },
  listCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#1C1917', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  listCopy: { flex: 1, minWidth: 0 },
  listTitle: { color: ACR.ink, fontSize: 14, fontWeight: '900' },
  listMeta: { color: ACR.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  listCaption: { color: ACR.ghost, fontSize: 10, fontWeight: '700', marginTop: 2 },
  chevron: { color: '#D1D5DB', fontSize: 22, fontWeight: '900' },
  statTile: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 18, padding: 13, alignItems: 'center' },
  statValue: { color: ACR.blue, fontSize: 20, fontWeight: '900' },
  statGreen: { color: ACR.green },
  statRose: { color: ACR.rose },
  statAmber: { color: '#D97706' },
  statLabel: { color: ACR.muted, fontSize: 11, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, marginTop: 12 },
  emptyIcon: { color: '#D1D5DB', fontSize: 34, fontWeight: '900' },
  emptyTitle: { color: ACR.ink, fontSize: 15, fontWeight: '900', marginTop: 8 },
  emptySubtitle: { color: ACR.muted, marginTop: 4, textAlign: 'center', fontSize: 12 },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 }
});
