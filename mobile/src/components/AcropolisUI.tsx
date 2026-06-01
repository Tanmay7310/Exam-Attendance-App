import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/theme';

export const ACR = {
  royal: '#1E3A8A',
  royalDark: '#172F73',
  blue: '#2563EB',
  gold: '#D4AF37',
  goldDeep: '#C4A35A',
  ivory: '#F9F7F4',
  card: '#FFFFFF',
  border: '#EDE8E0',
  ink: '#1C1917',
  muted: '#8B8070',
  ghost: '#A09890',
  blueSoft: '#EFF6FF',
  amberSoft: '#FFFBEB',
  green: '#059669',
  rose: '#B91C1C'
};

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

export const ScreenShell = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <KeyboardAvoidingView
    style={[styles.screen, style]}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    {children}
  </KeyboardAvoidingView>
);

export const AcropolisHomeBar = ({ title, subtitle, onLogout, right }: HeaderProps) => (
  <>
    <SafeAreaView edges={['top']} style={styles.homeBar}>
      <BannerPattern />
      <View style={styles.homeRow}>
        <ColumnCrest />
        <View style={styles.homeTitleWrap}>
          <Text style={styles.homeTitle}>{title}</Text>
          {subtitle ? <Text style={styles.homeSubtitle}>{subtitle}</Text> : null}
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

export const AcropolisBackBar = ({ title, subtitle, onBack, right }: HeaderProps) => (
  <>
    <SafeAreaView edges={['top']} style={styles.backBar}>
      <BannerPattern />
      <View style={styles.backRow}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <View style={styles.backTitleWrap}>
          <Text style={styles.backTitle}>{title}</Text>
          {subtitle ? <Text style={styles.backSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.rightSlot}>{right}</View>
      </View>
    </SafeAreaView>
    <GoldCornice />
  </>
);

export const GoldCornice = () => (
  <View style={styles.cornice}>
    <View style={styles.corniceLine} />
    <View style={styles.corniceAccent} />
  </View>
);

export const HeroCard = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.heroCard, style]}>
    <BannerPattern />
    {children}
  </View>
);

export const SectionLabel = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <View style={styles.sectionLabelRow}>
    <Text style={styles.sectionLabel}>{title}</Text>
    <View style={styles.goldRule} />
    {action}
  </View>
);

export const TextIcon = ({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'gold' | 'green' | 'red' | 'dark' }) => (
  <View style={[styles.textIcon, iconToneStyles[tone]]}>
    <Text style={[styles.textIconText, iconTextToneStyles[tone]]}>{label}</Text>
  </View>
);

export const ActionCard = ({ title, subtitle, icon, iconNode, tone = 'light', onPress }: ActionCardProps) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, tone === 'dark' && styles.actionCardDark, pressed && styles.pressed]}>
    {iconNode ?? <TextIcon label={icon ?? ''} tone={tone === 'dark' ? 'gold' : 'blue'} />}
    <Text style={[styles.actionTitle, tone === 'dark' && styles.actionTitleDark]}>{title}</Text>
    {subtitle ? <Text style={[styles.actionSubtitle, tone === 'dark' && styles.actionSubtitleDark]}>{subtitle}</Text> : null}
  </Pressable>
);

export const QrCodeMark = () => (
  <View style={styles.qrBox}>
    <View style={styles.qrIconCanvas}>
      <View style={[styles.qrCorner, styles.qrCornerTopLeft]} />
      <View style={[styles.qrCorner, styles.qrCornerTopRight]} />
      <View style={[styles.qrCorner, styles.qrCornerBottomLeft]} />
      <View style={[styles.qrDot, styles.qrDotOne]} />
      <View style={[styles.qrDot, styles.qrDotTwo]} />
      <View style={[styles.qrDot, styles.qrDotThree]} />
      <View style={[styles.qrMiniLine, styles.qrMiniLineOne]} />
      <View style={[styles.qrMiniLine, styles.qrMiniLineTwo]} />
    </View>
  </View>
);

export const FileTextMark = () => (
  <View style={styles.fileTextBox}>
    <View style={styles.fileIconCanvas}>
      <View style={styles.fileFold} />
      <View style={styles.fileLineOne} />
      <View style={styles.fileLineTwo} />
      <View style={styles.fileLineThree} />
    </View>
  </View>
);

export const IconMark = ({ kind, tone = 'blue', size = 48 }: { kind: IconKind; tone?: 'blue' | 'indigo' | 'green' | 'amber' | 'rose'; size?: number }) => {
  const palette = iconPalette[tone];
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
  const palette = iconPalette[tone];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}>
      <View style={[styles.moduleAccent, { backgroundColor: palette.color }]} />
      <IconMark kind={iconKind} tone={tone} size={56} />
      <View style={styles.moduleCopy}>
        <View style={styles.moduleTitleRow}>
          <Text style={styles.moduleTitle}>{title}</Text>
          {badge ? <Text style={styles.moduleBadge}>{badge}</Text> : null}
        </View>
        <Text style={styles.moduleSubtitle}>{subtitle}</Text>
        {stat ? (
          <View style={styles.moduleStatRow}>
            <Text style={[styles.moduleStat, { color: palette.color }]}>{stat}</Text>
            <Text style={styles.moduleStatLabel}>{statLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.moduleChevron}>{'>'}</Text>
    </Pressable>
  );
};

export const Pill = ({ label, active, onPress, tone = 'blue' }: { label: string; active?: boolean; onPress?: () => void; tone?: 'blue' | 'green' | 'red' }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={[styles.pill, active && pillActiveStyles[tone]]}>
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </Pressable>
);

export const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.emptyState}>
    <TextIcon label="i" tone="gold" />
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
  </View>
);

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

const iconToneStyles = StyleSheet.create({
  blue: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  gold: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  green: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  red: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  dark: { backgroundColor: '#1E3A8A', borderColor: '#28499F' }
});

const iconTextToneStyles = StyleSheet.create({
  blue: { color: ACR.blue },
  gold: { color: ACR.goldDeep },
  green: { color: ACR.green },
  red: { color: ACR.rose },
  dark: { color: '#FFFFFF' }
});

const pillActiveStyles = StyleSheet.create({
  blue: { backgroundColor: ACR.ink, borderColor: ACR.ink },
  green: { backgroundColor: ACR.green, borderColor: ACR.green },
  red: { backgroundColor: ACR.rose, borderColor: ACR.rose }
});

const iconPalette = {
  blue: { bg: '#EFF6FF', border: '#DBEAFE', color: '#2563EB' },
  indigo: { bg: '#EEF2FF', border: '#C7D2FE', color: '#4F46E5' },
  green: { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669' },
  amber: { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
  rose: { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' }
};

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
  screen: { flex: 1, backgroundColor: colors.bg },
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
