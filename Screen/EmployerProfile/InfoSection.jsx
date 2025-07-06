import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import FeedbackSection from "../../components/Profile/FeedbackSection";

const InfoSection = ({ employerData, employerId, coordinates, locationLoading }) => {
  return (
    <>
      {/* Company Description */}
      {employerData?.companyDescription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <View style={styles.descriptionContainer}>
            <Ionicons name="business-outline" size={20} color="#2558B6" />
            <Text style={styles.description}>
              {employerData.companyDescription}
            </Text>
          </View>
        </View>
      )}

      {/* Benefits */}
      {employerData?.benefits && employerData.benefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quyền lợi</Text>
          <View style={styles.benefitsContainer}>
            {employerData.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#4CAF50"
                />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Location */}
      {employerData?.companyAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={20} color="#2558B6" />
            <Text style={styles.address}>
              {employerData.companyAddress}
            </Text>
          </View>

          {/* Map */}
          {coordinates && (
            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>Xem bản đồ</Text>
              <View style={styles.mapWrapper}>
                {locationLoading ? (
                  <View style={styles.mapLoadingContainer}>
                    <ActivityIndicator size="small" color="#2558B6" />
                    <Text style={styles.mapLoadingText}>
                      Đang tải bản đồ...
                    </Text>
                  </View>
                ) : (
                  <MapView
                    style={styles.map}
                    region={coordinates}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                      }}
                      title={
                        employerData?.companyName || "Địa điểm làm việc"
                      }
                      description={employerData?.jobLocation}
                    >
                      <Image
                        source={{
                          uri:
                            employerData?.companyLogo ||
                            "https://via.placeholder.com/50",
                        }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 10,
                        }}
                        resizeMode="center"
                      />
                    </Marker>
                  </MapView>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Feedback Section */}
      <FeedbackSection
        accountId={employerId}
        feedbackType="JobSeekerToEmployer"
        title="Đánh giá từ người tìm việc"
        isEmployer={true}
      />
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginLeft: 8,
  },
  benefitsContainer: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  mapContainer: {
    marginTop: 8,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  mapWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    height: 200,
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
});

export default InfoSection;
