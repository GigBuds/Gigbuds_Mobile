import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

const FilterSection = ({ onFilterPress, filterType, appliedFilters }) => {
  console.log("Applied Filters:", appliedFilters);
  // Define the filter options with labels and values
  const filterOptions = [
    { label: "Bộ Lọc", value: "Mức Lương" },
  ];

  const isFilterActive = (filterValue) => {
    // Check if this filter type is currently active
    if (filterValue === "Mức Lương" && appliedFilters.salary === true) {
      return true;
    }
    return false;
  };

  return (
    <View style={styles.filterContainer}>
      <View style={styles.filterRow}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              isFilterActive(option.value) && styles.filterButtonActive,
            ]}
            onPress={() => onFilterPress(option.value)}
          >
            <Text
              style={[
                styles.filterText,
                isFilterActive(option.value) && styles.filterTextActive,
              ]}
            >
              {option.label}
            </Text>
            <Ionicons
              name="chevron-down-outline"
              size={15}
              color={isFilterActive(option.value) ? "#FFFFFF" : "#D2D2D2"}
              style={styles.filterIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  filterButton: {
    borderWidth: 2,
    borderColor: "#D2D2D2",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  filterButtonActive: {
    backgroundColor: "#FF7345",
    borderColor: "#FF7345",
  },
  filterText: {
    fontSize: 14,
    color: "#333",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  filterIcon: {
    marginLeft: 2,
  },
});

export default FilterSection;