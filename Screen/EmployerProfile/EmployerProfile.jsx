import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import EmployerService from "../../Services/EmployerService/EmployerService";
import { useLoading } from "../../context/LoadingContext";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import InfoSection from "./InfoSection";
import JobsSection from "./JobsSection";

const EmployerProfile = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { employerId } = route.params || {};
  const { showLoading, hideLoading } = useLoading();

  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // 'info' or 'jobs'

  useEffect(() => {
    if (employerId) {
      fetchEmployerProfile();
    } else {
      setError("Không tìm thấy thông tin nhà tuyển dụng");
      hideLoading();
    }
  }, [employerId]);

  const fetchEmployerProfile = async () => {
    try {
      showLoading();
      setError(null);

      const response = await EmployerService.getEmployerProfile(employerId);

      if (response.success) {
        setEmployerData(response.data);

        // Convert address to coordinates if available
        if (response.data?.companyAddress) {
          await convertAddressToCoordinates(response.data.companyAddress);
        }
      } else {
        setError(response.error || "Không thể tải thông tin nhà tuyển dụng");
      }
    } catch (err) {
      console.error("Error fetching employer profile:", err);
      setError("Đã xảy ra lỗi khi tải thông tin nhà tuyển dụng");
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const convertAddressToCoordinates = async (address) => {
    try {
      setLocationLoading(true);

      const geocodedLocation = await Location.geocodeAsync(address);

      if (geocodedLocation && geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];

        setCoordinates({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        console.warn("No coordinates found for address:", address);
        // Fallback to default Ho Chi Minh City coordinates
        setCoordinates({
          latitude: 10.8231,
          longitude: 106.6297,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      // Fallback to default coordinates
      setCoordinates({
        latitude: 10.8231,
        longitude: 106.6297,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRetry = () => {
    fetchEmployerProfile();
  };

  const formatNumber = (number) => {
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + "k";
    }
    return number.toString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader userProfile={employerData} employerId={employerId} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, height: 200 }}
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "info" && styles.activeTab]}
            onPress={() => setActiveTab("info")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "info" && styles.activeTabText,
              ]}
            >
              Giới thiệu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "jobs" && styles.activeTab]}
            onPress={() => setActiveTab("jobs")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "jobs" && styles.activeTabText,
              ]}
            >
              Tin tuyển dụng
            </Text>
          </TouchableOpacity>        </View>

        {activeTab === "info" ? (
          <InfoSection 
            employerData={employerData}
            employerId={employerId}
            coordinates={coordinates}
            locationLoading={locationLoading}
          />
        ) : (
          <JobsSection 
            employerId={employerId}
            employerData={employerData}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#2558B6",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#2558B6",
    fontWeight: "600",
  },
});

export default EmployerProfile;
