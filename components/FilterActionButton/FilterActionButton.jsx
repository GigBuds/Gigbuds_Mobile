import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";

const FilterActionButton = ({ 
  onClear, 
  onApply, 
  clearText = "Xoá bộ lọc", 
  applyText = "Áp dụng bộ lọc" 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearButton} onPress={onClear}>
        <Text style={styles.buttonText}>{clearText}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.applyButton} onPress={onApply}>
        <Text style={styles.buttonText}>{applyText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 5,
  },
  clearButton: {
    backgroundColor: "#737373",
    padding: 12,
    width: "48%",
    alignItems: "center",
    borderRadius: 10,
  },
  applyButton: {
    backgroundColor: "#FF7345",
    padding: 12,
    width: "48%",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default FilterActionButton;
