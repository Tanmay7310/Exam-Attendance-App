import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { buttonStyles } from '../styles/buttonStyles';
import { colors } from '../styles/theme';

export const LoginScreen = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
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
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <Text style={styles.title}>Exam Attendance</Text>
        <Text style={styles.subtitle}>Teacher/Admin secure login</Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          label="Username"
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          label="Password"
          mode="outlined"
          style={styles.input}
          secureTextEntry
        />

        <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} loading={loading} disabled={loading} onPress={onSubmit}>
          {loading ? 'Signing in...' : 'Login'}
        </Button>

        <Text style={styles.hint}>Use admin1/Admin@123 or teacher1/Teacher@123</Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg
  },
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.card
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: 18
  },
  input: {
    marginBottom: 12
  },
  button: {
    marginTop: 8
  },
  hint: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 12
  }
});
