import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import React from "react";
import { RadioButton } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import FilterActionButton from "../../components/FilterActionButton/FilterActionButton";
import JobPostService from "../../Services/JobPostService/JobPostService";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FilterBySalary = () => {
  const navigation = useNavigation();
  const [salaryUnit, setSalaryUnit] = React.useState("");
  const [salaryFrom, setSalaryFrom] = React.useState("");
  const [salaryTo, setSalaryTo] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  
  const salaryOptions = [
    { label: "Trả theo giờ", value: "Hour" },
    { label: "Trả theo ngày", value: "Day" },
    { label: "Trả theo ca", value: "Shift" },
  ];

  // Load saved search parameters from AsyncStorage
  const loadSavedFilters = async () => {
    try {
      const savedParams = await AsyncStorage.getItem('salaryFilter');
      if (savedParams) {
        const parsedParams = JSON.parse(savedParams);
        console.log('Loaded search params:', parsedParams);
        
        // Set the state with saved values
        setSalaryUnit(parsedParams.salaryUnit || "");
        setSalaryFrom(parsedParams.salaryFrom ? parsedParams.salaryFrom.toString() : "");
        setSalaryTo(parsedParams.salaryTo ? parsedParams.salaryTo.toString() : "");
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  };

  // Load filters when component focuses
  useFocusEffect(
    React.useCallback(() => {
      loadSavedFilters();
    }, [])
  );

  const handleApplyFilter = async () => {
    try {
      const searchParams = {
        salaryFrom: salaryFrom ? parseInt(salaryFrom) : undefined,
        salaryTo: salaryTo ? parseInt(salaryTo) : undefined,
        salaryUnit: salaryUnit || undefined
      };
      
        await AsyncStorage.setItem('salaryFilter', JSON.stringify(searchParams));
        await AsyncStorage.setItem('isSalaryFilterApplied', 'true');
        console.log('Saved search params:', searchParams);        
              navigation.goBack();

      } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert('Lỗi', 'Không thể áp dụng bộ lọc. Vui lòng thử lại sau.');
    }
  };

  const handleClearFilter = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('salaryFilter');
      console.log('Cleared salary filter from storage');
      
      // Clear state
      setSalaryUnit("");
      setSalaryFrom("");
      setSalaryTo("");
      AsyncStorage.removeItem('isSalaryFilterApplied');
      AsyncStorage.removeItem('salaryFilter');
      // Navigate back to search with no filters
      navigation.goBack();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterCard}>
        <RadioButton.Group
          onValueChange={(newValue) => setSalaryUnit(newValue)}
          value={salaryUnit}
        >
          {salaryOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => setSalaryUnit(item.value)}
              style={[
                styles.radioOption,
                salaryUnit === item.value && styles.radioOptionSelected
              ]}
            >
              <View style={styles.radioButtonContainer}>
                <RadioButton value={item.value} />
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  salaryUnit === item.value && styles.radioLabelSelected
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </RadioButton.Group>

        <View style={styles.salaryRangeContainer}>
          <Text style={styles.sectionTitle}>Mức Lương</Text>
          <View style={styles.salaryInputContainer}>
            <TextInput
              placeholder="Lương tối thiểu"
              style={styles.salaryInput}
              keyboardType="numeric"
              blurOnSubmit={true}
              returnKeyType="done"
              value={salaryFrom}
              onChangeText={(text) => setSalaryFrom(text)}
            />
            <Ionicons
              name="arrow-forward"
              size={24}
              color="#FF7345"
              style={styles.arrowIcon}
            />
            <TextInput
              placeholder="Lương tối đa"
              style={styles.salaryInput}
              keyboardType="numeric"
              blurOnSubmit={true}
              returnKeyType="done"
              value={salaryTo}
              onChangeText={(text) => setSalaryTo(text)}
            />
          </View>
        </View>
      </View>
      <FilterActionButton
        onClear={handleClearFilter}
        onApply={handleApplyFilter}
        clearText="Xoá bộ lọc"
        applyText={loading ? "Đang tìm kiếm..." : "Áp dụng bộ lọc"}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterCard: {
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 3 },
    elevation: 3, // For Android shadow
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  radioOptionSelected: {
    backgroundColor: "#F0F0F0",
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 50,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  radioLabelSelected: {
    color: "#FF7345",
  },
  salaryRangeContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  salaryInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  salaryInput: {
    color: "#FF7345",
    fontWeight: "bold",
    textAlign: "center",
    width: "40%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    backgroundColor: "white",
    fontSize: 14,
  },
  arrowIcon: {
    alignSelf: "center",
  },
});

export default FilterBySalary;
