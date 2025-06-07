import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SkillsForm = ({ 
  skillTags, 
  newSkill, 
  newSkillName, 
  onNewSkillChange, 
  onNewSkillNameChange, 
  onAddSkill, 
  onRemoveSkill, 
  renderSkillText 
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kỹ năng</Text>
      
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.addInput}
          value={newSkill}
          onChangeText={onNewSkillChange}
          placeholder="Nhập ID kỹ năng"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.addInput}
          value={newSkillName}
          onChangeText={onNewSkillNameChange}
          placeholder="Tên kỹ năng"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.addButton} onPress={onAddSkill}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {skillTags && skillTags.map((skill, index) => (
        <View key={index} style={styles.skillItem}>
          <Text style={styles.skillText}>
            {renderSkillText(skill)}
          </Text>
          <TouchableOpacity onPress={() => onRemoveSkill(index)}>
            <Ionicons name="close-circle" size={20} color="#FF6B6B" />
          </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2558B6",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7345",
    paddingLeft: 10,
    marginBottom: 20,
  },
  addItemContainer: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 15,
  },
  addInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FAFAFA",
  },
  addButton: {
    backgroundColor: "#2558B6",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    width: 50,
  },
  skillItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 16,
    color: "#2558B6",
  },
});

export default SkillsForm;