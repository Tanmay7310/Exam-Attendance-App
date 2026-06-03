import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { useAppTheme } from '../styles/appTheme';
import { ExportFormat } from '../utils/attendanceExport';

type ExportFormatDialogProps = {
  visible: boolean;
  exporting?: boolean;
  onDismiss: () => void;
  onSelect: (format: ExportFormat) => void;
};

export const ExportFormatDialog = ({ visible, exporting, onDismiss, onSelect }: ExportFormatDialogProps) => {
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={exporting ? undefined : onDismiss} style={[styles.dialog, { backgroundColor: theme.card }]}>
        <Dialog.Title style={[styles.title, { color: theme.ink }]}>Export Attendance</Dialog.Title>
        <Dialog.Content>
          <Text style={[styles.helper, { color: theme.muted }]}>Choose the file format you want to download.</Text>
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => onSelect('pdf')}
              disabled={exporting}
              style={styles.button}
            >
              Export as PDF
            </Button>
            <Button
              mode="outlined"
              onPress={() => onSelect('excel')}
              disabled={exporting}
              style={styles.button}
            >
              Export as Excel
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={exporting}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: { borderRadius: 24 },
  title: { fontWeight: '900' },
  helper: { fontSize: 13, fontWeight: '700', marginBottom: 14 },
  actions: { gap: 10 },
  button: { borderRadius: 14 }
});
