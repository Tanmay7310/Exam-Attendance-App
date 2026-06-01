import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AcropolisBackBar, HeroCard, ModuleCard, ScreenShell, SectionLabel } from '../../components/AcropolisUI';

export const AddSubjectsScreen = ({ navigation }: any) => {
  return (
    <ScreenShell>
      <AcropolisBackBar title="Subjects & Courses" subtitle="Catalogue management" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HeroCard>
          <View>
            <Text style={styles.heroKicker}>Academic Catalogue</Text>
            <Text style={styles.heroTitle}>Browse subjects by course or add new subject entries</Text>
          </View>
        </HeroCard>

        <SectionLabel title="Subject Actions" />
        <ModuleCard
          title="Subjects"
          subtitle="Browse courses, semesters, and assigned subjects"
          iconKind="book"
          tone="amber"
          onPress={() => navigation.navigate('SubjectsCourses')}
        />
        <ModuleCard
          title="Add New Subjects"
          subtitle="Add manually or import Excel/Word subject files"
          iconKind="plus"
          tone="blue"
          onPress={() => navigation.navigate('AddNewSubjects')}
        />
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 28 },
  heroKicker: { color: '#BFD1FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 5 }
});
