import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const EnterExamDetailsScreen = ({ navigation, route }: any) => {
  const returnTo = route?.params?.returnTo;
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');

  const canProceed = useMemo(
    () => [subject, branch, semester, year, section].every((v) => v.trim().length > 0),
    [subject, branch, semester, year, section]
  );

  const proceedToScan = () => {
    if (!canProceed) {
      showToast('Please enter Subject, Branch, Semester, Year and Section.', { type: 'info' });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Scan',
          params: {
            examDetails: {
              subject: subject.trim(),
              branch: branch.trim(),
              semester: semester.trim(),
              year: year.trim(),
              section: section.trim()
            },
            returnTo
          }
        }
      ]
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Enter Exam Details</Text>
      <Text style={styles.subText}>Fill in details before scanning student code.</Text>

      <TextInput
        label="Subject"
        mode="outlined"
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        label="Branch"
        mode="outlined"
        style={styles.input}
        value={branch}
        onChangeText={setBranch}
      />
      <TextInput
        label="Semester"
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        value={semester}
        onChangeText={setSemester}
      />
      <TextInput
        label="Year"
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        value={year}
        onChangeText={setYear}
      />
      <TextInput
        label="Section"
        mode="outlined"
        style={styles.input}
        value={section}
        onChangeText={setSection}
      />

      <Button mode="contained" style={[styles.button, !canProceed && styles.buttonDisabled]} contentStyle={buttonStyles.content} disabled={!canProceed} onPress={proceedToScan}>
        Continue To Scan
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: colors.bg },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subText: { color: colors.textMuted, marginBottom: 16 },
  input: {
    marginBottom: 10
  },
  button: {
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.7
  }
});
