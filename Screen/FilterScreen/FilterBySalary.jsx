import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Platform, ScrollView, ActionSheetIOS } from "react-native";
import React from "react";
import { RadioButton } from "react-native-paper";
import { Picker } from '@react-native-picker/picker';
import Ionicons from "@expo/vector-icons/Ionicons";
import FilterActionButton from "../../components/FilterActionButton/FilterActionButton";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { vietnamCities, getDistrictsByCity } from "./districtandprovince";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const FilterBySalary = () => {
  const navigation = useNavigation();
  const [salaryUnit, setSalaryUnit] = React.useState("");
  const [salaryFrom, setSalaryFrom] = React.useState("");
  const [salaryTo, setSalaryTo] = React.useState("");
  const [isMale, setIsMale] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("");
  const [selectedDistricts, setSelectedDistricts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  // New datetime states
  const [jobTimeFrom, setJobTimeFrom] = React.useState(null);
  const [jobTimeTo, setJobTimeTo] = React.useState(null);
  const [isDateTimePickerVisible, setDateTimePickerVisibility] = React.useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = React.useState('date');
  const [currentDateTimeField, setCurrentDateTimeField] = React.useState(null);
  
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
        setIsMale(parsedParams.isMale !== undefined ? parsedParams.isMale : "");
        setSelectedCity(parsedParams.cityId ? parsedParams.cityId.toString() : "");
        setSelectedDistricts(parsedParams.districtCodeList || []);
        setJobTimeFrom(parsedParams.jobTimeFrom ? new Date(parsedParams.jobTimeFrom) : null);
        setJobTimeTo(parsedParams.jobTimeTo ? new Date(parsedParams.jobTimeTo) : null);
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
        salaryUnit: salaryUnit || undefined,
        isMale: isMale === "" ? undefined : isMale,
        cityId: selectedCity ? parseInt(selectedCity) : undefined,
        districtCodeList: selectedDistricts.length > 0 ? selectedDistricts : undefined,
        jobTimeFrom: jobTimeFrom ? jobTimeFrom.toISOString() : undefined,
        jobTimeTo: jobTimeTo ? jobTimeTo.toISOString() : undefined
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
      await AsyncStorage.removeItem('salaryFilter');
      console.log('Cleared salary filter from storage');
      
      // Clear state
      setSalaryUnit("");
      setSalaryFrom("");
      setSalaryTo("");
      setIsMale("");
      setSelectedCity("");
      setSelectedDistricts([]);
      setJobTimeFrom(null);
      setJobTimeTo(null);
      AsyncStorage.removeItem('isSalaryFilterApplied');
      AsyncStorage.removeItem('salaryFilter');
      navigation.goBack();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const selectGender = () => {
    Alert.alert(
      "Chọn giới tính",
      "",
      [
        { text: "Nam", onPress: () => setIsMale(true) },
        { text: "Nữ", onPress: () => setIsMale(false) },
        { text: "Không chọn", onPress: () => setIsMale("") },
        { text: "Hủy", style: "cancel" }
      ]
    );
  };

  const selectCity = () => {
    const options = [
      ...vietnamCities.map(city => ({
        text: city.name,
        onPress: () => handleCityChange(city.id.toString())
      })),
      { text: "Không chọn", onPress: () => handleCityChange("") },
      { text: "Hủy", style: "cancel" }
    ];

    Alert.alert("Chọn thành phố", "", options);
  };

  const selectDistrict = () => {
    const availableDistricts = getAvailableDistricts();
    
    if (Platform.OS === 'ios') {
      // iOS ActionSheet
      const options = [
        ...availableDistricts.map(district => district.name),
        'Xóa tất cả',
        'Hủy'
      ];
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: options.length - 2,
          title: 'Chọn quận/huyện'
        },
        (buttonIndex) => {
          if (buttonIndex === options.length - 2) {
            // Clear all districts
            setSelectedDistricts([]);
          } else if (buttonIndex < availableDistricts.length) {
            // Toggle district selection
            const district = availableDistricts[buttonIndex];
            handleDistrictToggle(district.code);
          }
        }
      );
    } else {
      // Android Alert with multiple options
      const districtOptions = availableDistricts.map(district => ({
        text: `${selectedDistricts.includes(district.code) ? '✓ ' : ''}${district.name}`,
        onPress: () => handleDistrictToggle(district.code)
      }));
      
      const allOptions = [
        ...districtOptions,
        { text: "Xóa tất cả", onPress: () => setSelectedDistricts([]) },
        { text: "Hủy", style: "cancel" }
      ];

      Alert.alert("Chọn quận/huyện", "Nhấn để chọn/bỏ chọn quận/huyện", allOptions);
    }
  };

  const handleCityChange = (cityId) => {
    setSelectedCity(cityId);
    setSelectedDistricts([]); // Clear selected districts when city changes
  };

  const handleDistrictToggle = (districtCode) => {
    setSelectedDistricts(prev => {
      if (prev.includes(districtCode)) {
        return prev.filter(code => code !== districtCode);
      } else {
        return [...prev, districtCode];
      }
    });
  };

  const getSelectedCityName = () => {
    const city = vietnamCities.find(city => city.id === parseInt(selectedCity));
    return city ? city.name : "Chọn thành phố";
  };

  const getAvailableDistricts = () => {
    if (!selectedCity) return [];
    return getDistrictsByCity(parseInt(selectedCity));
  };

  const getSelectedDistrictsText = () => {
    if (selectedDistricts.length === 0) return "Chọn quận/huyện";
    if (selectedDistricts.length === 1) {
      const district = getAvailableDistricts().find(d => d.code === selectedDistricts[0]);
      return district ? district.name : "1 quận/huyện đã chọn";
    }
    return `${selectedDistricts.length} quận/huyện đã chọn`;
  };

  // DateTime picker handlers
  const showDateTimePicker = (field, mode) => {
    setCurrentDateTimeField(field);
    setDateTimePickerMode(mode);
    setDateTimePickerVisibility(true);
  };

  const hideDateTimePicker = () => {
    setDateTimePickerVisibility(false);
    setCurrentDateTimeField(null);
  };

  const handleDateTimeConfirm = (selectedDate) => {
    const currentDateTime = currentDateTimeField === 'from' ? jobTimeFrom : jobTimeTo;
    let newDateTime;
    
    if (dateTimePickerMode === 'date') {
      // Update date, keep existing time if any
      if (currentDateTime) {
        newDateTime = new Date(selectedDate);
        newDateTime.setHours(currentDateTime.getHours());
        newDateTime.setMinutes(currentDateTime.getMinutes());
      } else {
        newDateTime = selectedDate;
      }
    } else {
      // Update time, keep existing date if any
      if (currentDateTime) {
        newDateTime = new Date(currentDateTime);
        newDateTime.setHours(selectedDate.getHours());
        newDateTime.setMinutes(selectedDate.getMinutes());
      } else {
        newDateTime = selectedDate;
      }
    }
    
    if (currentDateTimeField === 'from') {
      setJobTimeFrom(newDateTime);
    } else {
      setJobTimeTo(newDateTime);
    }
    
    hideDateTimePicker();
  };

  const selectDateTime = (field) => {
    if (Platform.OS === 'ios') {
      const options = [
        'Chọn ngày',
        'Chọn giờ',
        'Xóa thời gian',
        'Hủy'
      ];
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
          title: field === 'from' ? 'Thời gian bắt đầu' : 'Thời gian kết thúc'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Select date
            showDateTimePicker(field, 'date');
          } else if (buttonIndex === 1) {
            // Select time
            showDateTimePicker(field, 'time');
          } else if (buttonIndex === 2) {
            // Clear time
            if (field === 'from') {
              setJobTimeFrom(null);
            } else {
              setJobTimeTo(null);
            }
          }
        }
      );
    } else {
      // Android - show options
      Alert.alert(
        field === 'from' ? 'Thời gian bắt đầu' : 'Thời gian kết thúc',
        'Chọn loại thời gian',
        [
          {
            text: 'Chọn ngày',
            onPress: () => showDateTimePicker(field, 'date')
          },
          {
            text: 'Chọn giờ',
            onPress: () => showDateTimePicker(field, 'time')
          },
          {
            text: 'Xóa thời gian',
            onPress: () => {
              if (field === 'from') {
                setJobTimeFrom(null);
              } else {
                setJobTimeTo(null);
              }
            }
          },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    
    const date = dateTime.toLocaleDateString('vi-VN');
    const time = dateTime.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${date} ${time}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* DateTime Picker Modal */}
      <DateTimePickerModal
        isVisible={isDateTimePickerVisible}
        mode={dateTimePickerMode}
        isDarkModeEnabled={false}
        date={
          currentDateTimeField === 'from' 
            ? jobTimeFrom || new Date()
            : jobTimeTo || new Date()
        }
        onConfirm={handleDateTimeConfirm}
        onCancel={hideDateTimePicker}
      />

      <View style={styles.filterCard}>
        {/* Salary Type Section */}
        <Text style={styles.sectionTitle}>Loại Lương</Text>
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

        {/* Gender Picker Section */}
        <View style={styles.genderContainer}>
          <Text style={styles.sectionTitle}>Giới tính</Text>
          <View style={styles.pickerContainer}>
            {Platform.OS === "ios" ? (
              <TouchableOpacity onPress={selectGender} disabled={loading}>
                <Text
                  style={{
                    padding: 12,
                    color: isMale === "" ? "gray" : "black",
                  }}
                >
                  {isMale === ""
                    ? "Chọn giới tính"
                    : isMale === true
                    ? "Nam"
                    : "Nữ"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Picker
                selectedValue={isMale}
                onValueChange={(itemValue) => setIsMale(itemValue)}
                style={styles.picker}
                prompt="Chọn giới tính"
                dropdownIconColor="#FF7345"
                mode="dropdown"
                enabled={!loading}
              >
                <Picker.Item label="Chọn giới tính" value="" />
                <Picker.Item label="Nam" value={true} />
                <Picker.Item label="Nữ" value={false} />
              </Picker>
            )}
          </View>
        </View>

        {/* City Picker Section */}
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>Thành phố</Text>
          <View style={styles.pickerContainer}>
            {Platform.OS === "ios" ? (
              <TouchableOpacity onPress={selectCity} disabled={loading}>
                <Text
                  style={{
                    padding: 12,
                    color: selectedCity === "" ? "gray" : "black",
                  }}
                >
                  {getSelectedCityName()}
                </Text>
              </TouchableOpacity>
            ) : (
              <Picker
                selectedValue={selectedCity}
                onValueChange={handleCityChange}
                style={styles.picker}
                prompt="Chọn thành phố"
                dropdownIconColor="#FF7345"
                mode="dropdown"
                enabled={!loading}
              >
                <Picker.Item label="Chọn thành phố" value="" />
                {vietnamCities.map((city) => (
                  <Picker.Item 
                    key={city.id} 
                    label={city.name} 
                    value={city.id.toString()} 
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>

        {/* District Action Sheet Section */}
        {selectedCity && (
          <View style={styles.districtContainer}>
            <Text style={styles.sectionTitle}>Quận/Huyện</Text>
            <TouchableOpacity 
              onPress={selectDistrict} 
              style={styles.pickerContainer}
              disabled={loading}
            >
              <Text
                style={{
                  padding: 12,
                  color: selectedDistricts.length === 0 ? "gray" : "black",
                }}
              >
                {getSelectedDistrictsText()}
              </Text>
            </TouchableOpacity>
            {selectedDistricts.length > 0 && (
              <View style={styles.selectedDistrictsContainer}>
                <Text style={styles.selectedDistrictsLabel}>Đã chọn:</Text>
                <Text style={styles.selectedDistrictsText}>
                  {selectedDistricts.map(code => {
                    const district = getAvailableDistricts().find(d => d.code === code);
                    return district ? district.name : code;
                  }).join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Salary Range Section */}
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

        {/* DateTime Range Section */}
        <View style={styles.dateTimeRangeContainer}>
          <Text style={styles.sectionTitle}>Thời gian làm việc</Text>
          <View style={styles.dateTimeInputContainer}>
            <TouchableOpacity 
              onPress={() => selectDateTime('from')}
              style={[
                styles.dateTimeInput,
                styles.datePickerInput
              ]}
              disabled={loading}
            >
              <Text style={[
                jobTimeFrom ? styles.datePickerText : styles.datePickerPlaceholder
              ]}>
                {jobTimeFrom ? formatDateTime(jobTimeFrom) : 'Thời gian bắt đầu'}
              </Text>
            </TouchableOpacity>
            
            <Ionicons
              name="arrow-forward"
              size={24}
              color="#FF7345"
              style={styles.arrowIcon}
            />
            
            <TouchableOpacity 
              onPress={() => selectDateTime('to')}
              style={[
                styles.dateTimeInput,
                styles.datePickerInput
              ]}
              disabled={loading}
            >
              <Text style={[
                jobTimeTo ? styles.datePickerText : styles.datePickerPlaceholder
              ]}>
                {jobTimeTo ? formatDateTime(jobTimeTo) : 'Thời gian kết thúc'}
              </Text>
            </TouchableOpacity>
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
    </ScrollView>
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
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },
  genderContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  locationContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  districtContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  selectedDistrictsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedDistrictsLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF7345",
    marginBottom: 5,
  },
  selectedDistrictsText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "white",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
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
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
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
  dateTimeRangeContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  dateTimeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dateTimeInput: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
    minHeight: 48,
    justifyContent: 'center',
  },
  datePickerInput: {
    justifyContent: "center",
  },
  datePickerText: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
  },
  datePickerPlaceholder: {
    fontSize: 14,
    color: "#a9a9a9",
    textAlign: "center",
  },
});

export default FilterBySalary;
