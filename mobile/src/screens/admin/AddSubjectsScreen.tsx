import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const AddSubjectsScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Subjects</Text>
      <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={() => navigation.navigate('SubjectsCourses')}>
        Subjects
      </Button>
      <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={() => navigation.navigate('AddNewSubjects')}>
        Add New Subjects
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: colors.bg },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  button: { marginTop: 10, borderRadius: 12 }
});
