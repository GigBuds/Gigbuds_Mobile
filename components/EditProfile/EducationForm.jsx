import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EducationForm = ({ 
  educations, 
  onAddEducation, 
  onUpdateEducation, 
  onRemoveEducation, 
  onDatePress,
  educationLevels 
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Học vấn</Text>
        <TouchableOpacity style={styles.addSectionButton} onPress={onAddEducation}>
          <Ionicons name="add" size={20} color="#2558B6" />
        </TouchableOpacity>
      </View>

      {educations && educations.map((edu, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>Học vấn {index + 1}</Text>
            <TouchableOpacity onPress={() => onRemoveEducation(index)}>
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên trường</Text>
            <TextInput
              style={styles.input}
              value={edu.schoolName || ""}
              onChangeText={(text) => onUpdateEducation(index, 'schoolName', text)}
              placeholder="Nhập tên trường"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chuyên ngành</Text>
            <TextInput
              style={styles.input}
              value={edu.major || ""}
              onChangeText={(text) => onUpdateEducation(index, 'major', text)}
              placeholder="Nhập chuyên ngành"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bằng cấp</Text>
            <View style={styles.levelContainer}>
              {educationLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    edu.level === level && styles.levelButtonActive
                  ]}
                  onPress={() => onUpdateEducation(index, 'level', level)}
                >
                  <Text style={[
                    styles.levelText,
                    edu.level === level && styles.levelTextActive
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>Ngày bắt đầu</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => onDatePress('education', index, 'startDate')}
              >
                <Text style={styles.dateText}>
                  {new Date(edu.startDate).toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#2558B6" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>Ngày kết thúc</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => onDatePress('education', index, 'endDate')}
              >
                <Text style={styles.dateText}>
                  {new Date(edu.endDate).toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#2558B6" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2558B6",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7345",
    paddingLeft: 10,
  },
  addSectionButton: {
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 20,
  },
  itemContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2558B6",
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
  levelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  levelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
  },
  levelButtonActive: {
    backgroundColor: "#2558B6",
    borderColor: "#2558B6",
  },
  levelText: {
    fontSize: 12,
    color: "#333",
  },
  levelTextActive: {
    color: "white",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInputGroup: {
    flex: 1,
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
});

export default EducationForm;