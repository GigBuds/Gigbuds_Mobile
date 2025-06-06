import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionHeader from './SectionHeader';
import ProfileCard from './ProfileCard';

const ExperienceSection = ({ experiences }) => {
  return (
    <View style={styles.container}>
      <SectionHeader title="Kỹ năng" />
      <View style={styles.experienceContainer}>
        {experiences && experiences.length > 0 ? (
          experiences.map((exp, index) => (
            <ProfileCard
              key={index}
              title={exp.jobPosition}
              subTitle={" "}
              startDate={exp.startDate}
              endDate={exp.endDate}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>
            Chưa có kỹ năng nào
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    borderBottomColor: "#D2D2D2",
    borderBottomWidth: 1,
    paddingVertical: 20,
  },
  experienceContainer: {
    flexDirection: "column",
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default ExperienceSection;