import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SectionHeader = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 5,
    borderColor: "#FF7345",
    paddingLeft: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2558B6",
  },
});

export default SectionHeader;