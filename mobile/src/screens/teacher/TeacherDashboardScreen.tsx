import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const TeacherDashboardScreen = ({ navigation }: any) => {
  const { auth, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome, {auth?.teacherName ?? auth?.username}</Text>
      <Text style={styles.meta}>Subject: {auth?.subject}</Text>
      <Text style={styles.meta}>Teacher ID: {auth?.teacherCode}</Text>

      <Button mode="contained" style={[styles.button, styles.bigButton]} onPress={() => navigation.navigate('EnterExamDetails', { returnTo: 'TeacherDashboard' })} contentStyle={buttonStyles.content}>
        Scan Student QR/Barcode
      </Button>

      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('AttendanceList')} contentStyle={buttonStyles.content}>
        View Attendance
      </Button>

      <Button mode="outlined" textColor={colors.danger} style={styles.logout} onPress={logout}>
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: colors.bg },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  meta: { color: colors.textMuted, marginBottom: 2 },
  button: {
    marginTop: 14,
    borderRadius: 12
  },
  bigButton: {
    marginTop: 24
  },
  logout: {
    marginTop: 24,
    borderColor: colors.danger
  }
});
