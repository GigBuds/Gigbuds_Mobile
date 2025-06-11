import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import SectionHeader from './SectionHeader';

const PersonalInfoSection = ({ userProfile }) => {
  return (
    <View style={styles.container}>
      <SectionHeader title="Thông tin cá nhân" />
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <FontAwesome5
            name={"birthday-cake"}
            size={27}
            color={"#2558B6"}
          />
          <View>
            <Text style={styles.labelText}>Ngày sinh</Text>
            <Text style={styles.valueText}>{userProfile?.dob}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name={"person"}
            size={27}
            color={"#2558B6"}
          />
          <View>
            <Text style={styles.labelText}>Giới tính</Text>
            <Text style={styles.valueText}>{userProfile?.isMale ? "Nam" : "Nữ"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name={"mail"}
            size={27}
            color={"#2558B6"}
          />
          <View>
            <Text style={styles.labelText}>Email</Text>
            <Text style={styles.valueText}>{userProfile?.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome5
            name={"phone-alt"}
            size={27}
            color={"#2558B6"}
          />
          <View>
            <Text style={styles.labelText}>Số điện thoại</Text>
            <Text style={styles.valueText}>{userProfile?.phoneNumber}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name={"location"}
            size={27}
            color={"#2558B6"}
          />
          <View>
            <Text style={styles.labelText}>Địa chỉ</Text>
            <Text style={styles.valueText}>{userProfile?.currentLocation}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    borderBottomColor: "#D2D2D2",
    borderBottomWidth: 1,
    paddingTop: 15,
  },
  infoContainer: {
    flexDirection: "column",
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 18,
    borderLeftColor: '#2558B6',
    borderLeftWidth: 5,
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginBottom: 15,
  },
  labelText: {
    color: '#737373',
    fontSize: 16,
  },
  valueText: {
    color: '#2558B6',
    fontSize: 15,
  },
});

export default PersonalInfoSection;