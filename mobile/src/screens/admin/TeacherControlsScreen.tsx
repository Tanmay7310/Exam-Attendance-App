import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { buttonStyles } from '../../styles/buttonStyles';
import { colors } from '../../styles/theme';

export const TeacherControlsScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Teacher Controls</Text>
      <Text style={styles.sub}>Choose an action</Text>

      <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={() => navigation.navigate('TeacherManagement')}>
        Teacher Management
      </Button>

      <Button mode="contained" style={styles.button} contentStyle={buttonStyles.content} onPress={() => navigation.navigate('Teachers')}>
        Teachers
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
  }
});
