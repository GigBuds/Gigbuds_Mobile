import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ProfileButtons = ({ onEditProfile, onUpdateSchedule }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={onEditProfile}
      >
        <Text style={styles.buttonText}>
          Cập nhật thông tin cơ bản
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={onUpdateSchedule}
      >
        <Text style={styles.buttonText}>
          Cập nhật lịch cá nhân
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#2558B6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
  },
  scheduleButton: {
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});

export default ProfileButtons;