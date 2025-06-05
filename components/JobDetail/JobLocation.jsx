import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Image } from 'react-native';
import MapView, { Marker } from "react-native-maps";

const JobLocation = ({ jobDetails, coordinates, locationLoading }) => {
  return (
    <View style={styles.descriptionSection}>
      <Text style={styles.sectionTitle}>Địa điểm làm việc</Text>
      <View style={styles.sentenceContainer}>
        <Text style={styles.bulletPoint}>•</Text>
        <Text style={styles.sentenceText}>{jobDetails?.jobLocation}</Text>
        <TouchableOpacity 
          onPress={() => {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobDetails?.jobLocation)}`;
            Linking.openURL(url);
          }}
        >
          <Text style={[styles.sentenceText, { color: '#2558B6', textDecorationLine: 'underline', marginLeft:10 }]}>
            Xem Bản Đồ 
          </Text>
        </TouchableOpacity>
      </View>

      {locationLoading ? (
        <View style={styles.mapLoadingContainer}>
          <Text style={styles.mapLoadingText}>Đang tải bản đồ...</Text>
        </View>
      ) : coordinates ? (
        <MapView
          style={styles.mapView}
          initialRegion={coordinates}
          showsTraffic={true}
          showsIndoors={true}
          showsBuildings={true}
          showsCompass={true}
          showsScale={false}
          showsPointsOfInterest={true}
          zoomEnabled={false}
          zoomControlEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          pitchEnabled={false}
          loadingEnabled={true}
          loadingIndicatorColor="#666666"
          loadingBackgroundColor="#eeeeee"
          provider="google"
          mapType="standard"
        >
          <Marker
            coordinate={{
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }}
            title={jobDetails?.companyName || "Địa điểm làm việc"}
            description={jobDetails?.jobLocation}
          >
            <Image
              source={{ uri: jobDetails?.companyLogo || "https://via.placeholder.com/50" }}
              style={{ width: 50, height: 50, borderRadius: 10 }}
              resizeMode="center"
            />
          </Marker>
        </MapView>
      ) : (
        <View style={styles.mapErrorContainer}>
          <Text style={styles.mapErrorText}>Không thể tải bản đồ</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2558B6",
  },
  sentenceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#2558B6",
    marginRight: 10,
    marginTop: 2,
  },
  sentenceText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
  mapView: {
    width: "100%",
    height: 300,
    marginTop: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  mapLoadingContainer: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginTop: 10,
  },
  mapLoadingText: {
    fontSize: 16,
    color: "gray",
  },
  mapErrorContainer: {
    width: "100%",
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginTop: 10,
  },
  mapErrorText: {
    fontSize: 16,
    color: "red",
  },
});

export default JobLocation;