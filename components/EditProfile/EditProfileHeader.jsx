import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EditProfileHeader = ({ onCancel, onSave, saving }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
        <Ionicons name="close" size={24} color="#2558B6" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chỉnh sửa profile</Text>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
          {saving ? "Đang lưu..." : "Lưu"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2558B6",
  },
  saveText: {
    fontSize: 16,
    color: "#2558B6",
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#999",
  },
});

export default EditProfileHeader;