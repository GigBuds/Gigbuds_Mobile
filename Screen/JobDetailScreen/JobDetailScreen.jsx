import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import logo from "../../assets/logo.png";
import { Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from "@react-navigation/native";
import JobPostService from "../../Services/JobPostService/JobPostService";
import iconMucLuong from "../../assets/mucluong.png";
import iconKinhNghiem from "../../assets/kinhnghiem.png";
import iconVitri from "../../assets/vitri.png";
import iconExpireTime from "../../assets/expireTime.png";
const JobDetailScreen = () => {
  const route = useRoute();
  const { jobId } = route.params || {};
  console.log("Job ID:", jobId);
  const [jobDetails, setJobDetails] = React.useState(null);

  const fetchJobDetails = async (id) => {
    try {
      const response = await JobPostService.getJobPostById(id);
      const jobDetails = await response.data;
      setJobDetails(jobDetails);
      console.log("Job Details:", jobDetails);
      // Handle job details here
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  React.useEffect(() => {
    if (jobId) {
      fetchJobDetails(jobId);
    } else {
      console.error("No job ID provided in route params");
    }
  }, [jobId]);

  const getProvince = (fullAddress) => {
    if (!fullAddress) return "Chưa có thông tin tỉnh";

    // Split by comma and get the last part (usually the province)
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

  return (
    <View style={styles.container}>
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
        <View style={{flexDirection: "row", alignItems: "center", gap: 10}}>
          <Image source={iconExpireTime} style={styles.expireTimeIcon} />
          <View style={{alignItems: "center"}}>
            <Text style={styles.infoText}>Hạn ứng tuyển</Text>
            <Text style={styles.infoTextDetail}>
              {formatExpireTime(jobDetails?.expireTime)}
            </Text>
          </View>
        </View>
      </View>
      <LinearGradient 
        colors={['#FF7345', '#FFDC95']} 
        start={{x: 0, y: 0}} 
        end={{x: 1.5, y: 0}}
        style={styles.gradientButton}
      >
        {jobDetails?.vacancyCount > 0 ? (
          <TouchableOpacity>
            <Text style={{ color: "white", textAlign: "center", fontSize: 16, fontWeight: "bold" }}>
              Chỉ còn {jobDetails?.vacancyCount} vị trí !
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: "white", textAlign: "center",fontSize: 16, fontWeight: "bold" }}>
            Hiện tại không có vị trí tuyển dụng
          </Text>
        )}
        
      </LinearGradient>
    </View>
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
    fontWeight: "bold",
    color: "#2558B6",
  },

gradientButton: {
  width: "100%",
  paddingVertical: 15,
  borderRadius: 10,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 10,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
},
});

export default JobDetailScreen;
