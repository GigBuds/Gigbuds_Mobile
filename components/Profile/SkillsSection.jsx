import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionHeader from './SectionHeader';

const SkillsSection = ({ skills }) => {
  return (
    <View style={styles.container}>
      <SectionHeader title="Kinh nghiệm" />
      <View style={styles.skillsContainer}>
        {skills && skills.length > 0 ? (
          skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>
                {skill.skillName}
              </Text>
            </View>
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
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skillTag: {
    alignItems: "center",
    backgroundColor: "#FF7345",
    borderRadius: 8,
    padding: 10,
  },
  skillText: {
    fontSize: 16,
    color: "white",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default SkillsSection;