import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

const FilterSection = ({
  onFilterPress,
  filterType,
  appliedFilters,
  selectedTab,
  setSelectedTab,
}) => {
  // Define the filter options with labels and values
  const filterOptions = [{ label: "Bộ Lọc", value: "Mức Lương" }];

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
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "Mới Nhất" && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab("Mới Nhất")}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Mới Nhất" && styles.tabTextActive,
              ]}
            >
              Mới nhất
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "Gợi Ý" && styles.tabButtonActive,
            ]}
            onPress={() => setSelectedTab("Gợi Ý")}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Gợi Ý" && styles.tabTextActive,
              ]}
            >
              Gợi ý cho bạn
            </Text>
          </TouchableOpacity>
        </View>
        {selectedTab === "Mới Nhất" && filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              isFilterActive(option.value) && styles.filterButtonActive,
            ]}
            onPress={() => onFilterPress(option.value)}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
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
    // Added background to ensure proper rendering
    backgroundColor: 'transparent',
  },
  tabContainer: {
    flexDirection: "row",
    // Added gap for better spacing on Android
    gap: Platform.OS === 'android' ? 8 : 0,
  },
  tabButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 8,
    // Added minimum dimensions for better touch target
    minWidth: 80,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // Android-specific improvements
    ...Platform.select({
      android: {
        elevation: 3,
        overflow: 'hidden',
      },
    }),
  },
  tabButtonActive: {
    borderBottomColor: "#FF7345",
    borderBottomWidth: 3,
    shadowOpacity: 0.3,
    elevation: 4,
    // Enhanced active state for Android
    ...Platform.select({
      android: {
        elevation: 6,
        backgroundColor: 'rgba(255, 115, 69, 0.1)',
      },
    }),
  },
  tabText: {
    color: "#333",
    fontSize: 20,
    textAlign: 'center',
    // Android text rendering improvements
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  tabTextActive: {
    color: "#2558B6",
    fontWeight: "bold",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomColor: "#D2D2D2",
    borderBottomWidth: 1,
    paddingTop: 10,
    // Improved Android layout
    ...Platform.select({
      android: {
        paddingBottom: 5,
      },
    }),
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
    // Better touch target for Android
    minHeight: 36,
    ...Platform.select({
      android: {
        elevation: 1,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: "#FF7345",
    borderColor: "#FF7345",
    ...Platform.select({
      android: {
        elevation: 3,
      },
    }),
  },
  filterText: {
    fontSize: 14,
    color: "#333",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
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
