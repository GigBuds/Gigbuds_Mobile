import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import JobCardTags from "./JobCardTags";
import JobCardTitle from "./JobCardTitle";
import JobCardInfo from "./JobCardInfo";
import JobCardSalary from "./JobCardSalary";

const JobCardItem = ({
  job,
  index,
  selectedTab,
  debouncedSearchInput,
  onPress,
  onFeedbackPress,
  getCity,
  getTimeAgo,
  getDistrict,
  getExperienceRequirement,
}) => {
  // Define gradient colors based on job priority or type
  const getGradientColors = () => {
    if (job.isOutstandingPost) {
      return ["#FFE0B2", "#FFCC80", "#FFB74D"]; // Orange gradient for urgent jobs
    }
    if (selectedTab === "Gợi Ý") {
      return ["#E3F2FD", "#BBDEFB", "#90CAF9"]; // Blue gradient for suggestions
    }
    return ["#F5F5F5", "#FFFFFF", "#F9F9F9"]; // Default subtle gradient
  };

  const getBorderGradient = () => {
    if (job.isOutstandingPost) {
      return ["#FF7043", "#FF5722"];
    }
    if (selectedTab === "Gợi Ý") {
      return ["#42A5F5", "#2196F3"];
    }
    return ["#64B5F6", "#2196F3"];
  };
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Left border gradient */}
        <LinearGradient
          colors={getBorderGradient()}
          style={styles.leftBorder}
        />        {/* Bookmark icon with gradient background */}
        <View style={styles.bookmarkContainer}>
          <Ionicons name="bookmark-outline" size={20} color="#666" />
        </View>
        <View style={styles.contentRow}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: job.companyLogo }}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          <View style={styles.jobInfoContainer}>
            <JobCardTitle
              jobTitle={job.jobTitle}
              searchTerm={debouncedSearchInput}
            />

            <JobCardInfo
              companyName={job.companyName}
              jobLocation={job.jobLocation}
              selectedTab={selectedTab}
              formattedDistance={job.formattedDistance}
              updatedAt={job.updatedAt}
              getCity={getCity}
              getTimeAgo={getTimeAgo}
            />
          </View>        </View>
        
        {job.salary && (
          <JobCardSalary salary={job.salary} salaryUnit={job.salaryUnit} />
        )}
        
        <JobCardTags
          job={job}
          index={index}
          getExperienceRequirement={getExperienceRequirement}
          getDistrict={getDistrict}
        />
        {/* Feedback Button for Job History */}
        {selectedTab === "JobHistory" && onFeedbackPress && (
          <TouchableOpacity
            style={styles.feedbackButton}            onPress={(e) => {
              e.stopPropagation();
              onFeedbackPress();
            }}
          >
            <Ionicons
              name="star"
              size={16}
              color="white"
              style={styles.feedbackIcon}
            />
            <Text style={styles.feedbackText}>Đánh giá</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradientContainer: {
    padding: 20,
    minHeight: 170,
    position: "relative",
  },
  leftBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  bookmarkContainer: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 6,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    marginRight: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: "#f0f0f0",
  },
  jobInfoContainer: {
    flex: 1,
  },
  feedbackButton: {
    backgroundColor: "#2558B6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  feedbackIcon: {
    marginRight: 6,
  },
  feedbackText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default JobCardItem;
