import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AcropolisBackBar, HeroCard, ModuleCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';

export const StudentManagementScreen = ({ navigation }: any) => {
  return (
    <ScreenShell>
      <AcropolisBackBar title="Student Management" subtitle="Enrollment and promotions" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroKicker}>Student Records</Text>
              <Text style={styles.heroTitle}>Manage class rosters and semester movement</Text>
            </View>
          </View>
        </HeroCard>

        <SectionLabel title="Student Modules" />
        <ModuleCard
          title="Add Student"
          subtitle="Create a new student profile with class context"
          iconKind="plus"
          tone="blue"
          onPress={() => navigation.navigate('AddStudent')}
        />
        <ModuleCard
          title="Students"
          subtitle="Search and manage enrolled student records"
          iconKind="users"
          tone="indigo"
          onPress={() => navigation.navigate('Students')}
        />
        <ModuleCard
          title="Promote Students"
          subtitle="Preview cohorts and move students to the next class"
          iconKind="activity"
          tone="green"
          onPress={() => navigation.navigate('PromoteStudents')}
        />
        <ModuleCard
          title="Promotion History"
          subtitle="Review batches, outcomes, and rollback status"
          iconKind="history"
          tone="amber"
          onPress={() => navigation.navigate('PromotionHistory')}
        />
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroKicker: { color: '#BFD1FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 5 }
});
