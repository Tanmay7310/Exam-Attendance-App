import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const StudentManagementScreen = ({ navigation }: any) => {

  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Student Management</Text>
      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('AddStudent')} contentStyle={buttonStyles.content}>
        Add Student
      </Button>
      <Button mode="contained" style={styles.button} onPress={() => navigation.navigate('Students')} contentStyle={buttonStyles.content}>
        Students
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12 },
  button: {
    marginBottom: 10,
    borderRadius: 10
  }
});
