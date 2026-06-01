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
import { StudentSemestersScreen } from '../screens/admin/StudentSemestersScreen';
import { StudentBranchesScreen } from '../screens/admin/StudentBranchesScreen';
import { StudentSectionsScreen } from '../screens/admin/StudentSectionsScreen';
import { StudentSectionStudentsScreen } from '../screens/admin/StudentSectionStudentsScreen';
import { PromoteStudentsScreen } from '../screens/admin/PromoteStudentsScreen';
import { PromotionHistoryScreen } from '../screens/admin/PromotionHistoryScreen';
import { PromotionBatchDetailsScreen } from '../screens/admin/PromotionBatchDetailsScreen';
import { AddSubjectsScreen } from '../screens/admin/AddSubjectsScreen';
import { AddNewSubjectsScreen } from '../screens/admin/AddNewSubjectsScreen';
import { SubjectsCoursesScreen } from '../screens/admin/SubjectsCoursesScreen';
import { SubjectsSemestersScreen } from '../screens/admin/SubjectsSemestersScreen';
import { SubjectsListScreen } from '../screens/admin/SubjectsListScreen';

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
          <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EnterExamDetails" component={EnterExamDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen name="AttendanceList" component={AttendanceListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AttendanceSessionDetails" component={AttendanceSessionDetailsScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdminLanding" component={AdminLandingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EnterExamDetails" component={EnterExamDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ headerShown: false, headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen name="AttendanceList" component={AttendanceListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AttendanceSessionDetails" component={AttendanceSessionDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TeacherControls" component={TeacherControlsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TeacherManagement" component={TeacherManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Teachers" component={TeachersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudentManagement" component={StudentManagementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddStudent" component={AddStudentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Students" component={StudentsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudentSemesters" component={StudentSemestersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudentBranches" component={StudentBranchesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudentSections" component={StudentSectionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudentSectionStudents" component={StudentSectionStudentsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PromoteStudents" component={PromoteStudentsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PromotionHistory" component={PromotionHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PromotionBatchDetails" component={PromotionBatchDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddSubjects" component={AddSubjectsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddNewSubjects" component={AddNewSubjectsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SubjectsCourses" component={SubjectsCoursesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SubjectsSemesters" component={SubjectsSemestersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SubjectsList" component={SubjectsListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AttendanceMonitoring" component={AttendanceMonitoringScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminAttendanceSubjects" component={AdminAttendanceSubjectsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminAttendanceDetails" component={AdminAttendanceDetailsScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};
