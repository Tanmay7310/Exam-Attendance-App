import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button, Text, TextInput } from 'react-native-paper';
import { useToast } from '../../context/ToastContext';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const EnterExamDetailsScreen = ({ navigation, route }: any) => {
  const branchOptions = ['CSE', 'CSIT', 'Civil', 'Mechanical', 'AIML', 'IT', 'DS', 'Cybersecurity', 'IoT'];
  const returnTo = route?.params?.returnTo;
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const semesterOptions = useMemo(() => {
    if (year === '1') return ['1', '2'];
    if (year === '2') return ['3', '4'];
    if (year === '3') return ['5', '6'];
    if (year === '4') return ['7', '8'];
    return [];
  }, [year]);

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

      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Year</Text>
        <Picker
          selectedValue={year}
          onValueChange={(value) => {
            const selectedYear = String(value);
            setYear(selectedYear);

            const allowedSemesters =
              selectedYear === '1' ? ['1', '2']
              : selectedYear === '2' ? ['3', '4']
              : selectedYear === '3' ? ['5', '6']
              : selectedYear === '4' ? ['7', '8']
              : [];

            if (!allowedSemesters.includes(semester)) {
              setSemester('');
            }
          }}
          style={styles.picker}
        >
          <Picker.Item label="Select Year" value="" />
          <Picker.Item label="1" value="1" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="3" value="3" />
          <Picker.Item label="4" value="4" />
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Semester</Text>
        <Picker
          selectedValue={semester}
          onValueChange={(value) => setSemester(String(value))}
          style={styles.picker}
          enabled={semesterOptions.length > 0}
        >
          <Picker.Item label={semesterOptions.length > 0 ? 'Select Semester' : 'Select Year First'} value="" />
          {semesterOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Branch</Text>
        <Picker
          selectedValue={branch}
          onValueChange={(value) => setBranch(String(value))}
          style={styles.picker}
        >
          <Picker.Item label="Select Branch" value="" />
          {branchOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrap}>
        <Text style={styles.pickerLabel}>Section</Text>
        <Picker
          selectedValue={section}
          onValueChange={(value) => setSection(String(value))}
          style={styles.picker}
        >
          <Picker.Item label="Select Section" value="" />
          <Picker.Item label="1" value="1" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="3" value="3" />
          <Picker.Item label="4" value="4" />
          <Picker.Item label="5" value="5" />
        </Picker>
      </View>
      <TextInput
        label="Subject"
        mode="outlined"
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
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
  pickerWrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden'
  },
  pickerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginHorizontal: 12
  },
  picker: {
    color: colors.text
  },
  button: {
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.7
  }
});
