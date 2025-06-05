import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const JobBenefits = ({ jobDetails }) => {
  const separateVietnameseSentences = (jobDescription) => {
    if (!jobDescription || typeof jobDescription !== "string") {
      return [];
    }

    let sentences = jobDescription
      .split(/[.!?]+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    const expandedSentences = [];

    sentences.forEach((sentence) => {
      const subSentences = sentence
        .split(/(?:^|\s)[-+*•]\s+|(?:^|\s)\d+\.\s+/)
        .map((sub) => sub.trim())
        .filter((sub) => sub.length > 0);
      expandedSentences.push(...subSentences);
    });

    return expandedSentences;
  };

  return (
    <View style={styles.descriptionSection}>
      <Text style={styles.sectionTitle}>Quyền lợi</Text>
      {separateVietnameseSentences(jobDetails?.benefit).map(
        (sentence, index) => (
          <View key={index} style={styles.sentenceContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sentenceText}>{sentence}</Text>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2558B6",
  },
  sentenceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#2558B6",
    marginRight: 10,
    marginTop: 2,
  },
  sentenceText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
});

export default JobBenefits;