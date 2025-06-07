import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PersonalInfoForm = ({ formData, onInputChange, onDatePress, formatDate }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Họ *</Text>
        <TextInput
          style={styles.input}
          value={formData.lastName}
          onChangeText={(text) => onInputChange('lastName', text)}
          placeholder="Nhập họ"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tên *</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={(text) => onInputChange('firstName', text)}
          placeholder="Nhập tên"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ngày sinh</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => onDatePress('dob')}
        >
          <Text style={styles.dateText}>
            {formatDate(formData.dob)}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#2558B6" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, formData.isMale && styles.genderButtonActive]}
            onPress={() => onInputChange('isMale', true)}
          >
            <Text style={[styles.genderText, formData.isMale && styles.genderTextActive]}>
              Nam
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, !formData.isMale && styles.genderButtonActive]}
            onPress={() => onInputChange('isMale', false)}
          >
            <Text style={[styles.genderText, !formData.isMale && styles.genderTextActive]}>
              Nữ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={formData.currentLocation}
          onChangeText={(text) => onInputChange('currentLocation', text)}
          placeholder="Nhập địa chỉ"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2558B6",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7345",
    paddingLeft: 10,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FAFAFA",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FAFAFA",
    height: 48,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 10,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  genderButtonActive: {
    backgroundColor: "#2558B6",
    borderColor: "#2558B6",
  },
  genderText: {
    fontSize: 16,
    color: "#333",
  },
  genderTextActive: {
    color: "white",
    fontWeight: "600",
  },
});

export default PersonalInfoForm;