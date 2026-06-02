import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { ACR } from '../components/AcropolisUI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../styles/appTheme';

export const LoginScreen = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const theme = useAppTheme();
  const [username, setUsername] = useState('teacher1');
  const [password, setPassword] = useState('Teacher@123');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      await login(username.trim(), password);
    } catch (e: any) {
      showToast(e?.response?.data?.message ?? 'Unable to login', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: 9 }).map((_, index) => <View key={index} style={[styles.heroLine, { left: 16 + index * 58 }]} />)}
            <View style={styles.heroBand} />
          </View>

          <View style={styles.crestOuter}>
            <View style={styles.crestInner}>
              <View style={styles.columnCap} />
              <View style={styles.columnGold} />
              <View style={styles.columnRow}>
                <View style={styles.columnPillar} />
                <View style={styles.columnPillar} />
                <View style={styles.columnPillar} />
              </View>
              <View style={styles.columnGold} />
              <View style={styles.columnCap} />
            </View>
            <View style={styles.crestDot} />
          </View>

          <Text style={styles.institute}>Acropolis Institute of Technology</Text>
          <Text style={styles.instituteGold}>& Research - Indore</Text>
          <View style={[styles.slant, { backgroundColor: theme.bg }]} />
        </View>

        <View style={[styles.formArea, { backgroundColor: theme.bg }]}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: theme.ink }]}>Attendance Portal</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Sign in to manage exam sessions</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.fieldLabel, { color: theme.goldDeep }]}>Faculty / Staff ID</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              label="Enter your ID or username"
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.card }]}
              textColor={theme.ink}
              outlineColor={theme.border}
              activeOutlineColor={theme.blue}
              autoCapitalize="none"
            />
            <Text style={[styles.fieldLabel, { color: theme.goldDeep }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              label="Password"
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.card }]}
              textColor={theme.ink}
              outlineColor={theme.border}
              activeOutlineColor={theme.blue}
              secureTextEntry
            />

            <View style={styles.archDivider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <View style={styles.dividerMark}>
                <View style={styles.dividerDot} />
                <View style={styles.dividerGoldLine} />
                <View style={styles.dividerDot} />
              </View>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Pressable onPress={onSubmit} disabled={loading} style={({ pressed }) => [styles.signInButton, { backgroundColor: theme.blue, shadowColor: theme.blue }, pressed && !loading && styles.pressed, loading && styles.disabledButton]}>
              <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In  >'}</Text>
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: theme.ghost }]}>Use admin1/Admin@123 or teacher1/Teacher@123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: { minHeight: 315, backgroundColor: ACR.royal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, overflow: 'hidden' },
  heroLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroBand: { position: 'absolute', left: 0, right: 0, bottom: 62, height: 58, backgroundColor: 'rgba(255,255,255,0.03)' },
  crestOuter: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: 'rgba(212,175,55,0.65)', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  crestInner: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  crestDot: { position: 'absolute', top: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: ACR.gold },
  columnCap: { width: 28, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
  columnGold: { width: 23, height: 2, borderRadius: 1, backgroundColor: ACR.gold, marginVertical: 2 },
  columnRow: { flexDirection: 'row', gap: 4, marginVertical: 2 },
  columnPillar: { width: 5, height: 22, borderRadius: 3, backgroundColor: '#FFFFFF' },
  institute: { color: 'rgba(255,255,255,0.68)', textTransform: 'uppercase', letterSpacing: 1.7, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  instituteGold: { color: ACR.gold, textTransform: 'uppercase', letterSpacing: 4, fontSize: 10, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  slant: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 14, transform: [{ skewY: '-2deg' }] },
  formArea: { flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  titleBlock: { alignItems: 'center', marginBottom: 22 },
  title: { color: ACR.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { color: '#6B6560', fontSize: 15, marginTop: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: ACR.border, padding: 20, shadowColor: '#1C1917', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  fieldLabel: { color: ACR.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },
  input: { marginBottom: 16, backgroundColor: '#FFFFFF' },
  archDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: ACR.border },
  dividerMark: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ACR.gold },
  dividerGoldLine: { width: 14, height: 1, backgroundColor: ACR.gold },
  signInButton: { minHeight: 58, borderRadius: 16, backgroundColor: ACR.blue, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: ACR.blue, shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  signInText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabledButton: { opacity: 0.65 },
  pressed: { transform: [{ scale: 0.98 }] },
  hint: { marginTop: 18, color: ACR.ghost, fontSize: 11, textAlign: 'center' }
});
