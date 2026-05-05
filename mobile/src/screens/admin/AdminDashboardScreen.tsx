import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const AdminDashboardScreen = ({ navigation }: any) => {
  const { auth, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome, {auth?.username}</Text>
      <Text style={styles.sub}>Admin controls</Text>

      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('TeacherControls')} contentStyle={buttonStyles.content}>
        Teacher Management
      </Button>

      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('StudentManagement')} contentStyle={buttonStyles.content}>
        Student Management
      </Button>

      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('AttendanceMonitoring')} contentStyle={buttonStyles.content}>
        Attendance Monitoring
      </Button>

      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('AddSubjects')} contentStyle={buttonStyles.content}>
        Add Subjects
      </Button>

      <Button mode="outlined" textColor={colors.danger} style={styles.logout} onPress={logout}>
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: colors.bg },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { marginTop: 4, color: colors.textMuted },
  button: {
    marginTop: 14,
    borderRadius: 12
  },
  logout: {
    marginTop: 24,
    borderColor: colors.danger
  }
});
