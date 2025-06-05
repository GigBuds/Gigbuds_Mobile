import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React from "react";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute } from "@react-navigation/native";
import JobPostService from "../../Services/JobPostService/JobPostService";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import iconMucLuong from "../../assets/mucluong.png";
import iconKinhNghiem from "../../assets/kinhnghiem.png";
import iconVitri from "../../assets/vitri.png";
import iconExpireTime from "../../assets/expireTime.png";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CalendarComp from "../../components/Calendar/Calendar";

const JobDetailScreen = () => {
  const route = useRoute();
  const { jobId } = route.params || {};
  console.log("Job ID:", jobId);
  const [jobDetails, setJobDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [coordinates, setCoordinates] = React.useState(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
const getDayName = (dayOfWeek) => {
    const days = {
      1: 'Chủ Nhật',
      2: 'Thứ 2', 
      3: 'Thứ 3',
      4: 'Thứ 4',
      5: 'Thứ 5',
      6: 'Thứ 6',
      7: 'Thứ 7'
    };
    return days[dayOfWeek] || 'Unknown';
  };
  const fetchJobDetails = async (id) => {
    try {
      setLoading(true);
      const response = await JobPostService.getJobPostById(id);
      const jobDetails = await response.data;
      setJobDetails(jobDetails);
      console.log("Job Details:", jobDetails);

      // Convert job location to coordinates after getting job details
      if (jobDetails?.jobLocation) {
        await convertAddressToCoordinates(jobDetails.jobLocation);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert address to coordinates using expo-location
  const convertAddressToCoordinates = async (address) => {
    try {
      setLocationLoading(true);
      console.log("Converting address to coordinates:", address);

      // Use expo-location geocoding to convert address to coordinates
      const geocodedLocation = await Location.geocodeAsync(address);

      if (geocodedLocation && geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        console.log("Coordinates found:", { latitude, longitude });

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

  React.useEffect(() => {
    if (jobId) {
      fetchJobDetails(jobId);
    } else {
      console.error("No job ID provided in route params");
      setLoading(false);
    }
  }, [jobId]);

  const getProvince = (fullAddress) => {
    if (!fullAddress) return "Chưa có thông tin tỉnh";
    const parts = fullAddress.split(",");
    return parts[parts.length - 1].trim();
  };

  const formatExpireTime = (expireTime) => {
    if (!expireTime) return "Chưa có thông tin";
    const date = new Date(expireTime);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const separateVietnameseSentences = (jobDescription) => {
    if (!jobDescription || typeof jobDescription !== "string") {
      return [];
    }

    let sentences = jobDescription
      .split(/[.!?]+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    const expandedSentences = [];

    sentences.forEach((sentence) => {
      const subSentences = sentence
        .split(/(?:^|\s)[-+*•]\s+|(?:^|\s)\d+\.\s+/)
        .map((sub) => sub.trim())
        .filter((sub) => sub.length > 0);
      expandedSentences.push(...subSentences);
    });

    return expandedSentences;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải thông tin công việc...</Text>
      </View>
    );
  }

  if (!jobDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy thông tin công việc</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={{ uri: jobDetails?.companyLogo }}
        resizeMode="center"
        style={styles.logo}
      />

      <View style={styles.titleSection}>
        <Text style={styles.jobTitle}> {jobDetails?.jobTitle} </Text>
        <TouchableOpacity>
          <Text style={styles.companyName}>
            {jobDetails?.companyName || "Chưa có tên công ty"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Image source={iconMucLuong} style={styles.salaryIcon} />
            <Text style={styles.infoText}>Mức lương</Text>
            <Text style={styles.infoTextDetail}>
              {jobDetails?.salary
                ? jobDetails.salary.toLocaleString("vi-VN")
                : "0"}
              đ /{" "}
              {jobDetails?.salaryUnit === "Hour"
                ? "Giờ"
                : jobDetails?.salaryUnit === "Day"
                ? "Ngày"
                : "Ca"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Image source={iconKinhNghiem} style={styles.experienceIcon} />
            <Text style={styles.infoText}>Kinh nghiệm</Text>
            <Text style={styles.infoTextDetail}>
              {jobDetails?.experienceRequirement?.includes(
                "Không yêu cầu kinh nghiệm"
              )
                ? "Không yêu cầu"
                : "Yêu cầu kinh nghiệm"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Image source={iconVitri} style={styles.locationIcon} />
            <Text style={styles.infoText}>Vị trí</Text>
            <Text style={styles.infoTextDetail}>
              {getProvince(jobDetails?.jobLocation)}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.expireTimeContainer}>
            <Image source={iconExpireTime} style={styles.expireTimeIcon} />
            <View style={styles.expireTimeTextContainer}>
              <Text style={styles.infoText}>Hạn ứng tuyển</Text>
              <Text style={styles.infoTextDetail}>
                {formatExpireTime(jobDetails?.expireTime)}
              </Text>
            </View>
          </View>
        </View>

        <LinearGradient
          colors={["#FF7345", "#FFDC95"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1.5, y: 0 }}
          style={styles.gradientButton}
        >
          {jobDetails?.vacancyCount > 0 ? (
            <TouchableOpacity>
              <Text style={styles.buttonText}>
                Chỉ còn {jobDetails?.vacancyCount} vị trí !
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.buttonText}>
              Hiện tại không có vị trí tuyển dụng
            </Text>
          )}
        </LinearGradient>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Mô tả công việc</Text>
          {separateVietnameseSentences(jobDetails?.jobDescription).map(
            (sentence, index) => (
              <View key={index} style={styles.sentenceContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.sentenceText}>{sentence}</Text>
              </View>
            )
          )}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Yêu cầu ứng viên</Text>
          {separateVietnameseSentences(jobDetails?.jobRequirement).map(
            (sentence, index) => (
              <View key={index} style={styles.sentenceContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.sentenceText}>{sentence}</Text>
              </View>
            )
          )}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Quyền lợi</Text>
          {separateVietnameseSentences(jobDetails?.benefit).map(
            (sentence, index) => (
              <View key={index} style={styles.sentenceContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.sentenceText}>{sentence}</Text>
              </View>
            )
          )}
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Địa điểm làm việc</Text>
          <View style={styles.sentenceContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.sentenceText}>{jobDetails?.jobLocation}</Text>
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
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={false}
              showsPointsOfInterest={true}
              showsUserLocation={true}
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

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Lịch làm việc</Text>
          {/* Schedule Summary */}
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleTitle}>Thông tin lịch làm:</Text>
            <Text style={styles.scheduleDetail}>
              • Số ca tối thiểu: {jobDetails?.jobSchedule?.minimumShift || 1} ca/tuần
            </Text>
            <Text style={styles.scheduleDetail}>
              • Tổng số ca: {jobDetails?.jobSchedule?.shiftCount || 0} ca/tuần
            </Text>
            
            {jobDetails?.jobSchedule?.jobShifts?.map((shift, index) => (
              <Text key={index} style={styles.scheduleDetail}>
                • {getDayName(shift.dayOfWeek)}: {shift.startTime} - {shift.endTime}
              </Text>
            ))}
          </View>
              <CalendarComp jobSchedule={jobDetails?.jobSchedule}/>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    paddingTop: 40,
  },
  logo: {
    backgroundColor: "black",
    position: "absolute",
    top: -100,
    zIndex: 1,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "white",
    height: 130,
    width: 130,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 16,
    color: "gray",
  },
  scrollContainer: {
    width: "100%",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 3,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginBottom: 10,
  },
  infoItem: {
    alignItems: "center",
    gap: 10,
  },
  expireTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expireTimeTextContainer: {
    alignItems: "center",
  },
  expireTimeIcon: {
    width: 20,
    height: 32,
  },
  salaryIcon: {
    width: 50,
    height: 50,
  },
  experienceIcon: {
    width: 50,
    height: 50,
  },
  locationIcon: {
    width: 44,
    height: 50,
  },
  infoText: {
    fontSize: 13,
    color: "gray",
  },
  infoTextDetail: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  gradientButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  descriptionSection: {
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 10,
    borderBottomColor:' #ccc',
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
  scheduleInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  scheduleDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default JobDetailScreen;
