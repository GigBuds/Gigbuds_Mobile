import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import JobPostService from "../../Services/JobPostService/JobPostService";

const JobCard = ({ searchResults, appliedFilters, marginBottom, loading: externalLoading }) => {
  const [jobData, setJobData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const fetchJobPosts = async () => {
    setLoading(true);
    try {
      const result = await JobPostService.searchJobPosts({});
      setJobData(result.success ? result.data.items || [] : []);

      if (!result.success) {
        console.error("Error fetching search results:", result.error);
      }
    } catch (error) {
      console.error("Error fetching job posts:", error);
      setJobData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    console.log("useEffect triggered:", { 
      hasSearchResults: !!searchResults, 
      hasItems: !!searchResults?.items,
      itemsLength: searchResults?.items?.length 
    });
    
    // If searchResults is explicitly provided and has items, use them
    if (searchResults?.items && Array.isArray(searchResults.items)) {
      console.log("Using searchResults items");
      setJobData(searchResults.items);
      setLoading(false);
    } 
    // Only fetch from API when searchResults is null/undefined (initial load)
    else if (searchResults === null || searchResults === undefined) {
      console.log("No searchResults provided, fetching from API");
      fetchJobPosts();
    }
    // If searchResults exists but is empty array, show empty state
    else {
      console.log("SearchResults provided but empty");
      setJobData([]);
      setLoading(false);
    }
  }, [searchResults]);

  // Use external loading state if provided, otherwise use internal loading
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  // Loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 16, color: "gray" }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // No data state
  if (!jobData || !Array.isArray(jobData) || jobData.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 16, color: "gray" }}>
          Không có dữ liệu công việc.
        </Text>
      </View>
    );
  }

  const getDistrict = (location) => {
    if (!location) return "";
    const parts = location.split(",");
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

    updatedDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now - updatedDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    return `${Math.abs(diffDays)} ngày trước`;
  };

  const getCity = (location) => {
    if (!location) return "";
    const parts = location.split(",");
    return parts.length > 1 ? parts[parts.length - 1].trim() : "";
  };

  return (
    <ScrollView bouncesZoom={true} style={{ marginBottom: marginBottom }}>
      {jobData.map((job, index) => (
        <TouchableOpacity
          key={job.id || `job-${index}`}
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
              {job.salary?.toLocaleString("vi-VN", {
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
          <View style={{ flexDirection: "row", gap: 5, marginTop: "3%" }}>
            {[
              getExperienceRequirement(job.experienceRequirement) ===
              "Không yêu cầu kinh nghiệm"
                ? "Không yêu cầu kinh nghiệm"
                : "Yêu cầu kinh nghiệm",

              job.isOutstandingPost ? "Cần gấp" : null,
              getDistrict(job.jobLocation),
              job.vacancyCount <= 5 ? `Còn ${job.vacancyCount} vị trí` : null,
            ]
              .filter(Boolean)
              .map((item, tagIndex, arr) => {
                const displayItems = arr.length > 3 ? arr.slice(0, 3) : arr;

                if (tagIndex >= displayItems.length) return null;

                return (
                  <View
                    key={`tag-${index}-${tagIndex}`}
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
              job.vacancyCount <= 5 ? `Còn ${job.vacancyCount} vị trí` : null,
            ].filter(Boolean).length > 3 && (
              <View
                key={`extra-${index}`}
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
                    job.vacancyCount <= 5
                      ? `Còn ${job.vacancyCount} vị trí`
                      : null,
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
