import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import React from "react";
import { jobData } from "../JobCard/data"; // Named import
import Ionicons from "@expo/vector-icons/Ionicons";
const JobCard = () => {
  if (!jobData.items || !Array.isArray(jobData.items)) {
    return <Text>No job data available.</Text>;
  }
  const getDistrict = (location) => {
    if (!location) return "";
    const parts = location.split(",");
    // Get the district (usually the first part before the city)
    return parts.length > 1 ? parts[parts.length - 2].trim() : "";
  };

  const getExperienceRequirement = (eR) => {
    if (!eR) return "";
    const parts = eR.split(",");
    return parts.length > 1 ? parts[0].trim() : "";
  };

  const getTimeAgo = (updateTime) => {
    if (!updateTime) return "";
    const updatedDate = new Date(updateTime);
    const now = new Date();

    // Reset hours for both dates to compare only the day
    updatedDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now - updatedDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    return `${-diffDays} ngày trước`;
  };

  const getCity = (location) => {
    if (!location) return "";
    const parts = location.split(",");
    return parts.length > 1 ? parts[parts.length - 1].trim() : "";
  };
  return (
    <ScrollView bouncesZoom={true} style={{ marginBottom: "10%" }}>
      {jobData.items.map((job, index) => (
        <TouchableOpacity
          key={job.id}
          style={{
            width: "100%",
            height: 150,
            backgroundColor: "white",
            position: "relative",
            marginBottom: 20,
            padding: 20,
            borderRadius: 20,
            borderLeftWidth: 3,
            borderLeftColor: "#2558B6",
          }}
        >
          <Ionicons
            name="bookmark-outline"
            size={28}
            color="gray"
            style={{ position: "absolute", top: 15, right: 15 }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: "50%",
            }}
          >
            <Image
              source={{ uri: job.companyLogo }}
              style={{
                width: "17%",
                height: "100%",
                borderRadius: "100%",
                marginBottom: 10,
                backgroundColor: "black",
              }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 10, width: "84%" }}>
              <Text
                style={{ fontWeight: "bold", fontSize: 18, width: "80%" }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {job.jobTitle}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "gray", fontSize: 10 }}>
                  {job.companyName}
                </Text>
                <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
                <Text style={{ color: "gray", fontSize: 10 }}>
                  {getCity(job.jobLocation)}
                </Text>
                <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
                <Text style={{ color: "gray", fontSize: 10 }}>
                  {getTimeAgo(job.updateTime)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              marginTop: 10,
            }}
          >
            <Text
              style={{ color: "#FF7345", fontSize: 20, fontWeight: "bold" }}
            >
              {job.salary.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </Text>
            <Text style={{ color: "gray", fontSize: 20 }}>/</Text>
            <Text style={{ color: "gray", fontSize: 20, fontWeight: "bold" }}>
              {job.salaryUnit === "Day"
                ? "Ngày"
                : job.salaryUnit === "Shift"
                ? "Ca"
                : "Giờ"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 5, marginTop:'3%' }}>
            {[
              getExperienceRequirement(job.experienceRequirement) ===
              "Không yêu cầu kinh nghiệm"
                ? "Không yêu cầu kinh nghiệm"
                : "Yêu cầu kinh nghiệm",
                
              job.isOutstandingPost ? "Cần gấp" : null,
              getDistrict(job.jobLocation),
              job.vacancyCount <= 5 ? `Còn ${job.vacancyCount} vị trí` : null 
            ]
              .filter(Boolean) // Remove any nulls
              .reduce((acc, curr) => {
                acc.push(curr);
                return acc;
              }, [])
              .map((item, index, arr) => {
                const displayItems = arr.length > 3 ? arr.slice(0, 3) : arr;
                const extraCount = arr.length - 3;

                if (index >= displayItems.length) return null;

                return (
                  <View
                    key={index}
                    style={{
                      borderRadius: 10,
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderWidth: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Text style={{ fontSize: 10 }}>{item}</Text>
                  </View>
                );
              })}

            {/* Show "+N" if more than 3 */}
            {[
              getExperienceRequirement(job.experienceRequirement) ===
              "Không yêu cầu kinh nghiệm"
                ? "Không yêu cầu kinh nghiệm"
                : "Yêu cầu kinh nghiệm",
              job.isOutstandingPost ? "Cần gấp" : null,
              getDistrict(job.jobLocation),
               job.vacancyCount <= 5 ? `Còn ${job.vacancyCount} vị trí` : null 
            ].filter(Boolean).length > 3 && (
              <View
                style={{
                  borderRadius: 10,
                  alignItems: "center",
                  paddingHorizontal: 5,
                  paddingVertical: 3,
                  borderWidth: 1,
                  flexWrap: "wrap",
                }}
              >
                <Text style={{ fontSize: 10 }}>
                  +
                  {[
                    getExperienceRequirement(job.experienceRequirement) ===
                    "Không yêu cầu kinh nghiệm"
                      ? "Không yêu cầu kinh nghiệm"
                      : "Yêu cầu kinh nghiệm",
                    job.isOutstandingPost ? "Cần gấp" : null,
                    getDistrict(job.jobLocation),
                     job.vacancyCount <= 5 ? `Còn ${job.vacancyCount} vị trí` : null 
                  ].filter(Boolean).length - 3}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default JobCard;
