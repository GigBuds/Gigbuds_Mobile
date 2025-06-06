import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionHeader from './SectionHeader';
import ProfileCard from './ProfileCard';

const EducationSection = ({ educations }) => {
  return (
    <View style={styles.container}>
      <SectionHeader title="Học vấn" />
      <View style={styles.educationContainer}>
        {educations && educations.length > 0 ? (
          educations.map((edu, index) => (
            <ProfileCard
              key={index}
              title={edu.schoolName}
              subTitle={edu.major}
              startDate={edu.startDate}
              endDate={edu.endDate}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>
            Chưa có thông tin học vấn
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
  educationContainer: {
    flexDirection: "column",
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default EducationSection;