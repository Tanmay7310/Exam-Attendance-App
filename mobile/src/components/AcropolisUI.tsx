import React from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightThemeTokens, type AppThemeTokens, useAppTheme } from '../styles/appTheme';

export const ACR = lightThemeTokens;

type HeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onLogout?: () => void;
  right?: React.ReactNode;
};

type ActionCardProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  iconNode?: React.ReactNode;
  tone?: 'light' | 'dark' | 'gold';
  onPress: () => void;
};

type ModuleCardProps = {
  title: string;
  subtitle: string;
  stat?: string;
  statLabel?: string;
  iconKind: IconKind;
  tone?: 'blue' | 'indigo' | 'green' | 'amber' | 'rose';
  badge?: string;
  onPress: () => void;
};

export type IconKind = 'scan' | 'file' | 'settings' | 'activity' | 'users' | 'teacher' | 'book' | 'student' | 'plus' | 'history';

export type SelectOption = {
  label: string;
  value: string;
};

export const ScreenShell = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const theme = useAppTheme();
  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.bg }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export const AcropolisHomeBar = ({ title, subtitle, onLogout, right }: HeaderProps) => {
  const theme = useAppTheme();
  return (
    <>
      <SafeAreaView edges={['top']} style={[styles.homeBar, { backgroundColor: theme.royal }]}>
        <BannerPattern />
        <View style={styles.homeRow}>
          <ColumnCrest />
          <View style={styles.homeTitleWrap}>
            <Text style={styles.homeTitle}>{title}</Text>
            {subtitle ? <Text style={[styles.homeSubtitle, { color: theme.headerSubtle }]}>{subtitle}</Text> : null}
          </View>
          {right ?? (
            onLogout ? (
              <Pressable onPress={onLogout} style={styles.headerIconButton}>
                <Text style={styles.headerIconText}>OUT</Text>
              </Pressable>
            ) : null
          )}
        </View>
      </SafeAreaView>
      <GoldCornice />
    </>
  );
};

export const AcropolisBackBar = ({ title, subtitle, onBack, right }: HeaderProps) => {
  const theme = useAppTheme();
  return (
    <>
      <SafeAreaView edges={['top']} style={[styles.backBar, { backgroundColor: theme.royal }]}>
        <BannerPattern />
        <View style={styles.backRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>{'<'}</Text>
          </Pressable>
          <View style={styles.backTitleWrap}>
            <Text style={styles.backTitle}>{title}</Text>
            {subtitle ? <Text style={[styles.backSubtitle, { color: theme.headerSubtle }]}>{subtitle}</Text> : null}
          </View>
          <View style={styles.rightSlot}>{right}</View>
        </View>
      </SafeAreaView>
      <GoldCornice />
    </>
  );
};

export const GoldCornice = () => {
  const theme = useAppTheme();
  return (
    <View style={[styles.cornice, { backgroundColor: theme.royalDark }]}>
      <View style={[styles.corniceLine, { backgroundColor: theme.gold }]} />
      <View style={styles.corniceAccent} />
    </View>
  );
};

export const HeroCard = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.heroCard, { backgroundColor: theme.royal, shadowColor: theme.shadow }, style]}>
      <BannerPattern />
      {children}
    </View>
  );
};

export const SectionLabel = ({ title, action }: { title: string; action?: React.ReactNode }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={[styles.sectionLabel, { color: theme.goldDeep }]}>{title}</Text>
      <View style={[styles.goldRule, { backgroundColor: theme.goldDeep }]} />
      {action}
    </View>
  );
};

export const TextIcon = ({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'gold' | 'green' | 'red' | 'dark' }) => {
  const theme = useAppTheme();
  const palette = getTextIconPalette(theme)[tone];
  return (
    <View style={[styles.textIcon, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.textIconText, { color: palette.color }]}>{label}</Text>
    </View>
  );
};

export const ActionCard = ({ title, subtitle, icon, iconNode, tone = 'light', onPress }: ActionCardProps) => {
  const theme = useAppTheme();
  const dark = tone === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.actionCard,
      {
        backgroundColor: dark ? theme.royal : theme.card,
        borderColor: dark ? theme.royal : theme.border,
        shadowColor: theme.shadow
      },
      pressed && styles.pressed
    ]}>
      {iconNode ?? <TextIcon label={icon ?? ''} tone={dark ? 'gold' : 'blue'} />}
      <Text style={[styles.actionTitle, { color: dark ? '#FFFFFF' : theme.ink }]}>{title}</Text>
      {subtitle ? <Text style={[styles.actionSubtitle, { color: dark ? theme.headerSubtle : theme.muted }]}>{subtitle}</Text> : null}
    </Pressable>
  );
};

export const QrCodeMark = () => {
  const theme = useAppTheme();
  return (
  <View style={[styles.qrBox, { backgroundColor: theme.blueSoft }]}>
    <View style={styles.qrIconCanvas}>
      <View style={[styles.qrCorner, { borderColor: theme.blue }, styles.qrCornerTopLeft]} />
      <View style={[styles.qrCorner, { borderColor: theme.blue }, styles.qrCornerTopRight]} />
      <View style={[styles.qrCorner, { borderColor: theme.blue }, styles.qrCornerBottomLeft]} />
      <View style={[styles.qrDot, { backgroundColor: theme.blue }, styles.qrDotOne]} />
      <View style={[styles.qrDot, { backgroundColor: theme.blue }, styles.qrDotTwo]} />
      <View style={[styles.qrDot, { backgroundColor: theme.blue }, styles.qrDotThree]} />
      <View style={[styles.qrMiniLine, { backgroundColor: theme.blue }, styles.qrMiniLineOne]} />
      <View style={[styles.qrMiniLine, { backgroundColor: theme.blue }, styles.qrMiniLineTwo]} />
    </View>
  </View>
  );
};

export const FileTextMark = () => {
  const theme = useAppTheme();
  return (
  <View style={[styles.fileTextBox, { backgroundColor: theme.blueSoft }]}>
    <View style={[styles.fileIconCanvas, { borderColor: theme.blue }]}>
      <View style={[styles.fileFold, { borderColor: theme.blue, backgroundColor: theme.blueSoft }]} />
      <View style={[styles.fileLineOne, { backgroundColor: theme.blue }]} />
      <View style={[styles.fileLineTwo, { backgroundColor: theme.blue }]} />
      <View style={[styles.fileLineThree, { backgroundColor: theme.blue }]} />
    </View>
  </View>
  );
};

export const IconMark = ({ kind, tone = 'blue', size = 48 }: { kind: IconKind; tone?: 'blue' | 'indigo' | 'green' | 'amber' | 'rose'; size?: number }) => {
  const theme = useAppTheme();
  const palette = getIconPalette(theme)[tone];
  const boxStyle = { width: size, height: size, borderRadius: Math.round(size * 0.25), backgroundColor: palette.bg, borderColor: palette.border };
  const markColor = palette.color;

  if (kind === 'scan') return <QrCodeMark />;
  if (kind === 'file') return <FileTextMark />;

  return (
    <View style={[styles.genericIconBox, boxStyle]}>
      {kind === 'settings' ? <SettingsGlyph color={markColor} /> : null}
      {kind === 'activity' ? <ActivityGlyph color={markColor} /> : null}
      {kind === 'users' || kind === 'student' ? <UsersGlyph color={markColor} /> : null}
      {kind === 'teacher' ? <TeacherGlyph color={markColor} /> : null}
      {kind === 'book' ? <BookGlyph color={markColor} /> : null}
      {kind === 'plus' ? <PlusGlyph color={markColor} /> : null}
      {kind === 'history' ? <HistoryGlyph color={markColor} /> : null}
    </View>
  );
};

export const ModuleCard = ({ title, subtitle, stat, statLabel, iconKind, tone = 'blue', badge, onPress }: ModuleCardProps) => {
  const theme = useAppTheme();
  const palette = getIconPalette(theme)[tone];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.moduleCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}>
      <View style={[styles.moduleAccent, { backgroundColor: palette.color }]} />
      <IconMark kind={iconKind} tone={tone} size={56} />
      <View style={styles.moduleCopy}>
        <View style={styles.moduleTitleRow}>
          <Text style={[styles.moduleTitle, { color: theme.ink }]}>{title}</Text>
          {badge ? <Text style={styles.moduleBadge}>{badge}</Text> : null}
        </View>
        <Text style={[styles.moduleSubtitle, { color: theme.muted }]}>{subtitle}</Text>
        {stat ? (
          <View style={[styles.moduleStatRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.moduleStat, { color: palette.color }]}>{stat}</Text>
            <Text style={[styles.moduleStatLabel, { color: theme.ghost }]}>{statLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.moduleChevron, { color: theme.ghost }]}>{'>'}</Text>
    </Pressable>
  );
};

export const Pill = ({ label, active, onPress, tone = 'blue' }: { label: string; active?: boolean; onPress?: () => void; tone?: 'blue' | 'green' | 'red' }) => {
  const theme = useAppTheme();
  const activeColor = tone === 'green' ? theme.green : tone === 'red' ? theme.rose : theme.ink;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }, active && { backgroundColor: activeColor, borderColor: activeColor }]}>
      <Text style={[styles.pillText, { color: active ? '#FFFFFF' : theme.muted }]}>{label}</Text>
    </Pressable>
  );
};

export const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const theme = useAppTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TextIcon label="i" tone="gold" />
      <Text style={[styles.emptyTitle, { color: theme.ink }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
    </View>
  );
};

export const AcropolisSelectField = ({
  label,
  value,
  placeholder,
  options,
  disabled,
  helperText,
  onSelect
}: {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  disabled?: boolean;
  helperText?: string;
  onSelect: (value: string) => void;
}) => {
  const theme = useAppTheme();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);
  const displayValue = selected?.label ?? value;
  const canOpen = !disabled && options.length > 0;

  return (
    <>
      <Pressable
        onPress={() => {
          if (canOpen) setOpen(true);
        }}
        disabled={!canOpen}
        style={({ pressed }) => [
          styles.selectField,
          {
            backgroundColor: theme.input,
            borderColor: value ? theme.blue : theme.border,
            opacity: disabled ? 0.6 : 1
          },
          pressed && canOpen && styles.pressed
        ]}
      >
        <View style={styles.selectTopRow}>
          <Text style={[styles.selectLabel, { color: theme.goldDeep }]}>{label}</Text>
          {value ? <Text style={[styles.selectStatus, { color: theme.blue }]}>Selected</Text> : null}
        </View>
        <View style={styles.selectValueRow}>
          <View style={styles.selectCopy}>
            <Text style={[styles.selectValue, { color: value ? theme.ink : theme.ghost }]} numberOfLines={2}>
              {value ? displayValue : placeholder}
            </Text>
            {helperText ? <Text style={[styles.selectHelper, { color: theme.muted }]} numberOfLines={2}>{helperText}</Text> : null}
          </View>
          <Text style={[styles.selectChevron, { color: canOpen ? theme.blue : theme.ghost }]}>v</Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.selectBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.selectSheet, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]} onPress={() => undefined}>
            <View style={[styles.selectSheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.selectSheetEyebrow, { color: theme.goldDeep }]}>{label}</Text>
            <Text style={[styles.selectSheetTitle, { color: theme.ink }]}>Choose an option</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.selectList}
              contentContainerStyle={styles.selectListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.selectOption,
                      {
                        backgroundColor: isSelected ? theme.blueSoft : theme.cardAlt,
                        borderColor: isSelected ? theme.blue : theme.border
                      },
                      pressed && styles.pressed
                    ]}
                  >
                    <Text style={[styles.selectOptionLabel, { color: isSelected ? theme.blue : theme.ink }]} numberOfLines={2}>
                      {item.label}
                    </Text>
                    {isSelected ? <Text style={[styles.selectOptionCheck, { color: theme.goldDeep }]}>Selected</Text> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={[styles.selectEmpty, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                  <Text style={[styles.selectEmptyText, { color: theme.muted }]}>No options available</Text>
                </View>
              }
            />
            <Pressable onPress={() => setOpen(false)} style={[styles.selectCancel, { backgroundColor: theme.royal }]}>
              <Text style={styles.selectCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export const initialsOf = (value?: string) => {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
};

const BannerPattern = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {Array.from({ length: 10 }).map((_, index) => (
      <View key={index} style={[styles.patternLine, { left: 24 + index * 58 }]} />
    ))}
    <View style={styles.patternBand} />
  </View>
);

const ColumnCrest = () => (
  <View style={styles.crestOuter}>
    <View style={styles.crestCircle}>
      <View style={styles.columnCap} />
      <View style={styles.columnRow}>
        <View style={styles.columnPillar} />
        <View style={styles.columnPillar} />
        <View style={styles.columnPillar} />
      </View>
      <View style={styles.columnCap} />
    </View>
  </View>
);

const getTextIconPalette = (theme: AppThemeTokens) => ({
  blue: { bg: theme.blueSoft, border: theme.isDark ? '#1D4D80' : '#DBEAFE', color: theme.blue },
  gold: { bg: theme.amberSoft, border: theme.isDark ? '#5F481B' : '#FDE68A', color: theme.goldDeep },
  green: { bg: theme.greenSoft, border: theme.isDark ? '#145A42' : '#BBF7D0', color: theme.green },
  red: { bg: theme.roseSoft, border: theme.isDark ? '#6B2132' : '#FECACA', color: theme.rose },
  dark: { bg: theme.royal, border: theme.royalDark, color: '#FFFFFF' }
});

const getIconPalette = (theme: AppThemeTokens) => ({
  blue: { bg: theme.blueSoft, border: theme.isDark ? '#1D4D80' : '#DBEAFE', color: theme.blue },
  indigo: { bg: theme.isDark ? '#1B2142' : '#EEF2FF', border: theme.isDark ? '#303A73' : '#C7D2FE', color: theme.isDark ? '#A5B4FC' : '#4F46E5' },
  green: { bg: theme.greenSoft, border: theme.isDark ? '#145A42' : '#A7F3D0', color: theme.green },
  amber: { bg: theme.amberSoft, border: theme.isDark ? '#5F481B' : '#FDE68A', color: theme.isDark ? theme.gold : '#D97706' },
  rose: { bg: theme.roseSoft, border: theme.isDark ? '#6B2132' : '#FECACA', color: theme.rose }
});

const SettingsGlyph = ({ color }: { color: string }) => (
  <View style={[styles.glyphCircle, { borderColor: color }]}>
    <View style={[styles.glyphDot, { backgroundColor: color }]} />
  </View>
);

const ActivityGlyph = ({ color }: { color: string }) => (
  <View style={styles.activityGlyph}>
    <View style={[styles.activityBar, { height: 10, backgroundColor: color }]} />
    <View style={[styles.activityBar, { height: 18, backgroundColor: color }]} />
    <View style={[styles.activityBar, { height: 14, backgroundColor: color }]} />
  </View>
);

const UsersGlyph = ({ color }: { color: string }) => (
  <View style={styles.usersGlyph}>
    <View style={[styles.userHead, { borderColor: color }]} />
    <View style={[styles.userBody, { borderColor: color }]} />
    <View style={[styles.userHeadSmall, { borderColor: color }]} />
  </View>
);

const TeacherGlyph = ({ color }: { color: string }) => (
  <View style={styles.teacherGlyph}>
    <View style={[styles.teacherHead, { borderColor: color }]} />
    <View style={[styles.teacherBody, { borderColor: color }]} />
    <View style={[styles.teacherBadge, { backgroundColor: color }]} />
  </View>
);

const BookGlyph = ({ color }: { color: string }) => (
  <View style={[styles.bookGlyph, { borderColor: color }]}>
    <View style={[styles.bookSpine, { backgroundColor: color }]} />
    <View style={[styles.bookLine, { backgroundColor: color }]} />
  </View>
);

const PlusGlyph = ({ color }: { color: string }) => (
  <View style={styles.plusGlyph}>
    <View style={[styles.plusHorizontal, { backgroundColor: color }]} />
    <View style={[styles.plusVertical, { backgroundColor: color }]} />
  </View>
);

const HistoryGlyph = ({ color }: { color: string }) => (
  <View style={[styles.historyGlyph, { borderColor: color }]}>
    <View style={[styles.historyHandLong, { backgroundColor: color }]} />
    <View style={[styles.historyHandShort, { backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  homeBar: { backgroundColor: ACR.royal, overflow: 'hidden' },
  backBar: { backgroundColor: ACR.royal, overflow: 'hidden' },
  homeRow: { minHeight: 76, paddingHorizontal: 18, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backRow: { minHeight: 70, paddingHorizontal: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  homeTitleWrap: { flex: 1 },
  homeTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  homeSubtitle: { color: '#BFD1FF', marginTop: 2, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  backText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  backTitleWrap: { flex: 1, paddingHorizontal: 4 },
  backTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  backSubtitle: { color: '#BFD1FF', marginTop: 2, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  rightSlot: { minWidth: 44, alignItems: 'flex-end' },
  headerIconButton: { minWidth: 44, minHeight: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  headerIconText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  cornice: { height: 5, backgroundColor: ACR.royalDark },
  corniceLine: { height: 1, backgroundColor: 'rgba(212,175,55,0.75)' },
  corniceAccent: { height: 2, width: '42%', backgroundColor: '#FFFFFF', opacity: 0.95, marginTop: 2, marginLeft: 36 },
  patternLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  patternBand: { position: 'absolute', left: 0, right: 0, bottom: 10, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  crestOuter: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.75)', alignItems: 'center', justifyContent: 'center' },
  crestCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  columnCap: { width: 18, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' },
  columnRow: { flexDirection: 'row', gap: 3, marginVertical: 3 },
  columnPillar: { width: 3, height: 13, borderRadius: 1.5, backgroundColor: '#FFFFFF' },
  heroCard: { backgroundColor: ACR.royal, borderRadius: 24, padding: 18, overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 10 },
  sectionLabel: { color: ACR.goldDeep, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  goldRule: { flex: 1, height: 1, backgroundColor: 'rgba(196,163,90,0.45)' },
  textIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  textIconText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  qrBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  qrIconCanvas: { width: 25, height: 25, position: 'relative' },
  qrCorner: { position: 'absolute', width: 8, height: 8, borderWidth: 2, borderColor: ACR.blue, borderRadius: 1 },
  qrCornerTopLeft: { left: 1, top: 1 },
  qrCornerTopRight: { right: 1, top: 1 },
  qrCornerBottomLeft: { left: 1, bottom: 1 },
  qrDot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: ACR.blue },
  qrDotOne: { left: 13, top: 13 },
  qrDotTwo: { right: 2, bottom: 2 },
  qrDotThree: { right: 8, bottom: 8 },
  qrMiniLine: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: ACR.blue },
  qrMiniLineOne: { width: 8, right: 1, top: 17 },
  qrMiniLineTwo: { width: 5, left: 13, bottom: 1 },
  fileTextBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  fileIconCanvas: { width: 21, height: 25, borderWidth: 2, borderColor: '#4F46E5', borderRadius: 2, position: 'relative' },
  fileFold: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  fileLineOne: { position: 'absolute', left: 4, right: 4, top: 9, height: 2, borderRadius: 1, backgroundColor: '#4F46E5' },
  fileLineTwo: { position: 'absolute', left: 4, right: 4, top: 14, height: 2, borderRadius: 1, backgroundColor: '#4F46E5' },
  fileLineThree: { position: 'absolute', left: 4, width: 7, top: 19, height: 2, borderRadius: 1, backgroundColor: '#4F46E5' },
  genericIconBox: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  glyphCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  glyphDot: { width: 8, height: 8, borderRadius: 4 },
  activityGlyph: { width: 26, height: 24, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  activityBar: { width: 5, borderRadius: 3 },
  usersGlyph: { width: 28, height: 24 },
  userHead: { position: 'absolute', left: 4, top: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  userBody: { position: 'absolute', left: 1, bottom: 1, width: 18, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 2 },
  userHeadSmall: { position: 'absolute', right: 2, top: 5, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  teacherGlyph: { width: 27, height: 25 },
  teacherHead: { position: 'absolute', left: 7, top: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  teacherBody: { position: 'absolute', left: 3, bottom: 1, width: 21, height: 11, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderWidth: 2 },
  teacherBadge: { position: 'absolute', right: 1, bottom: 2, width: 7, height: 7, borderRadius: 2 },
  bookGlyph: { width: 23, height: 25, borderWidth: 2, borderRadius: 3 },
  bookSpine: { position: 'absolute', left: 5, top: 0, bottom: 0, width: 2 },
  bookLine: { position: 'absolute', left: 10, right: 4, top: 8, height: 2, borderRadius: 1 },
  plusGlyph: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  plusHorizontal: { position: 'absolute', width: 22, height: 4, borderRadius: 2 },
  plusVertical: { position: 'absolute', width: 4, height: 22, borderRadius: 2 },
  historyGlyph: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  historyHandLong: { position: 'absolute', left: 11, top: 6, width: 2, height: 8, borderRadius: 1 },
  historyHandShort: { position: 'absolute', left: 11, top: 12, width: 7, height: 2, borderRadius: 1 },
  actionCard: { flex: 1, backgroundColor: ACR.card, borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 16, minHeight: 148, shadowColor: '#1C1917', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  actionCardDark: { backgroundColor: ACR.royal, borderColor: ACR.royal },
  actionTitle: { color: ACR.ink, fontSize: 16, fontWeight: '900', marginTop: 16 },
  actionTitleDark: { color: '#FFFFFF' },
  actionSubtitle: { color: ACR.muted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  actionSubtitleDark: { color: '#BFD1FF' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  pill: { borderWidth: 1, borderColor: ACR.border, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  pillText: { color: ACR.muted, fontSize: 12, fontWeight: '800' },
  pillTextActive: { color: '#FFFFFF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, marginTop: 12 },
  emptyTitle: { color: ACR.ink, fontWeight: '900', marginTop: 12, fontSize: 16 },
  emptySubtitle: { color: ACR.muted, marginTop: 4, textAlign: 'center' },
  selectField: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 },
  selectTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  selectLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  selectStatus: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  selectValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9 },
  selectCopy: { flex: 1, minWidth: 0 },
  selectValue: { fontSize: 15, fontWeight: '900', lineHeight: 20 },
  selectHelper: { fontSize: 11, fontWeight: '700', lineHeight: 15, marginTop: 3 },
  selectChevron: { fontSize: 18, fontWeight: '900' },
  selectBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.55)', justifyContent: 'flex-end', padding: 14 },
  selectSheet: { borderWidth: 1, borderRadius: 26, padding: 16, maxHeight: '78%', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 10 },
  selectSheetHandle: { width: 42, height: 4, borderRadius: 999, alignSelf: 'center', marginBottom: 14 },
  selectSheetEyebrow: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  selectSheetTitle: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  selectList: { marginTop: 14 },
  selectListContent: { gap: 9, paddingBottom: 4 },
  selectOption: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectOptionLabel: { flex: 1, fontSize: 14, fontWeight: '900', lineHeight: 19 },
  selectOptionCheck: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  selectEmpty: { borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  selectEmptyText: { fontSize: 13, fontWeight: '800' },
  selectCancel: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  selectCancelText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  moduleCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ACR.border, borderRadius: 22, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 13, shadowColor: '#1C1917', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  moduleAccent: { width: 4, alignSelf: 'stretch', borderRadius: 999, opacity: 0.45 },
  moduleCopy: { flex: 1, minWidth: 0 },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moduleTitle: { color: ACR.ink, fontSize: 15, fontWeight: '900', flexShrink: 1 },
  moduleSubtitle: { color: ACR.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  moduleBadge: { color: '#047857', backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  moduleStatRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  moduleStat: { fontSize: 12, fontWeight: '900' },
  moduleStatLabel: { color: ACR.ghost, fontSize: 11, fontWeight: '700' },
  moduleChevron: { color: '#D1D5DB', fontSize: 24, fontWeight: '900' }
});
