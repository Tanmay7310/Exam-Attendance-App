import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { TeacherDashboardScreen } from '../screens/teacher/TeacherDashboardScreen';
import { EnterExamDetailsScreen } from '../screens/teacher/EnterExamDetailsScreen';
import { ScanScreen } from '../screens/teacher/ScanScreen';
import { AttendanceListScreen } from '../screens/teacher/AttendanceListScreen';
import { AttendanceSessionDetailsScreen } from '../screens/teacher/AttendanceSessionDetailsScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminLandingScreen } from '../screens/admin/AdminLandingScreen';
import { TeacherControlsScreen } from '../screens/admin/TeacherControlsScreen';
import { TeacherManagementScreen } from '../screens/admin/TeacherManagementScreen';
import { TeachersScreen } from '../screens/admin/TeachersScreen';
import { AttendanceMonitoringScreen } from '../screens/admin/AttendanceMonitoringScreen';
import { AdminAttendanceSubjectsScreen } from '../screens/admin/AdminAttendanceSubjectsScreen';
import { AdminAttendanceDetailsScreen } from '../screens/admin/AdminAttendanceDetailsScreen';
import { StudentManagementScreen } from '../screens/admin/StudentManagementScreen';
import { AddStudentScreen } from '../screens/admin/AddStudentScreen';
import { StudentsScreen } from '../screens/admin/StudentsScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { loading, auth } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!auth ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : auth.role === 'TEACHER' ? (
        <>
          <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} options={{ title: 'Teacher Dashboard' }} />
          <Stack.Screen name="EnterExamDetails" component={EnterExamDetailsScreen} options={{ title: 'Enter Exam Details' }} />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ title: 'Scan Student Code', headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen name="AttendanceList" component={AttendanceListScreen} options={{ title: 'Session Attendance' }} />
          <Stack.Screen name="AttendanceSessionDetails" component={AttendanceSessionDetailsScreen} options={{ title: 'Attendance Details' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdminLanding" component={AdminLandingScreen} options={{ title: 'Admin' }} />
          <Stack.Screen name="EnterExamDetails" component={EnterExamDetailsScreen} options={{ title: 'Enter Exam Details' }} />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ title: 'Scan Student Code', headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen name="AttendanceList" component={AttendanceListScreen} options={{ title: 'Session Attendance' }} />
          <Stack.Screen name="AttendanceSessionDetails" component={AttendanceSessionDetailsScreen} options={{ title: 'Attendance Details' }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="TeacherControls" component={TeacherControlsScreen} options={{ title: 'Teacher Management' }} />
          <Stack.Screen name="TeacherManagement" component={TeacherManagementScreen} options={{ title: 'Teacher Management' }} />
          <Stack.Screen name="Teachers" component={TeachersScreen} options={{ title: 'Teachers' }} />
          <Stack.Screen name="StudentManagement" component={StudentManagementScreen} options={{ title: 'Student Management' }} />
          <Stack.Screen name="AddStudent" component={AddStudentScreen} options={{ title: 'Add Student' }} />
          <Stack.Screen name="Students" component={StudentsScreen} options={{ title: 'Students' }} />
          <Stack.Screen name="AttendanceMonitoring" component={AttendanceMonitoringScreen} options={{ title: 'Attendance Monitoring' }} />
          <Stack.Screen name="AdminAttendanceSubjects" component={AdminAttendanceSubjectsScreen} options={{ title: 'Attendance Subjects' }} />
          <Stack.Screen name="AdminAttendanceDetails" component={AdminAttendanceDetailsScreen} options={{ title: 'Attendance Details' }} />
        </>
      )}
    </Stack.Navigator>
  );
};
