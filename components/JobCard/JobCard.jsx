import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import JobPostService from "../../Services/JobPostService/JobPostService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLoading } from "../../context/LoadingContext";
import JobApplicationService from "../../Services/JobApplicationService/JobApplicationService";
import Pagination from "../Pagination/Pagination";

const JobCard = ({
  appliedFilters,
  marginBottom,
  searchParams,
  selectedTab,
  searchInput,
}) => {
  const { showLoading, hideLoading } = useLoading();

  const [jobData, setJobData] = React.useState(null);
  const [jobSeekerId, setJobSeekerId] = React.useState(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [pageSize] = React.useState(10); // Items per page
  
  const navigate = useNavigation();

  React.useEffect(() => {
    const getUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        setJobSeekerId(userId);
      } catch (error) {
        console.error("Error getting userId:", error);
      }
    };
    getUserId();
  }, []);

  // Helper function to extract distance in km
  const getDistanceInKm = (formattedDistance) => {
    if (!formattedDistance) return Infinity;
    const numericValue = parseFloat(formattedDistance.replace(/[^\d.]/g, ""));
    if (formattedDistance.includes("m") && !formattedDistance.includes("km")) {
      return numericValue / 1000;
    }
    return numericValue || Infinity;
  };

  // Filter function to get jobs within 50km (only for "Gợi Ý" tab)
  const filterJobsByDistance = (jobs) => {
    if (!jobs || !Array.isArray(jobs)) return jobs;
    if (selectedTab !== "Gợi Ý") return jobs;
    return jobs.filter((job) => {
      const distanceKm = getDistanceInKm(job.formattedDistance);
      return distanceKm <= 50;
    });
  };

  // Filter function for search input (jobTitle)
  const filterJobsByTitle = (jobs) => {
    if (!jobs || !Array.isArray(jobs) || !searchInput || !searchInput.trim()) {
      return jobs;
    }
    const searchTerm = searchInput.trim().toLowerCase();
    return jobs.filter((job) => {
      const jobTitle = job.jobTitle?.toLowerCase() || "";
      return jobTitle.includes(searchTerm);
    });
  };

  // Sort function based on selected tab
  const sortJobData = (jobs) => {
    if (!jobs || !Array.isArray(jobs)) return [];
    const sortedJobs = [...jobs];

    if (selectedTab === "Gợi Ý") {
      return sortedJobs.sort((a, b) => {
        const distanceA = getDistanceInKm(a.formattedDistance);
        const distanceB = getDistanceInKm(b.formattedDistance);
        return distanceA - distanceB;
      });
    } else {
      return sortedJobs.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0);
        const dateB = new Date(b.updatedAt || 0);
        return dateB - dateA; // Newest first
      });
    }
  };

  const fetchJobPosts = async (searchPar, page = 1) => {
    try {
      let result;

      if (selectedTab === "Gợi Ý") {
        showLoading();
        setLocationLoading(true);

        result = await JobPostService.getRecommendedJobPosts(jobSeekerId, {
          pageIndex: page - 1, // Convert to 0-based index for API
          pageSize: pageSize,
          includeScheduleMatching: true,
          includeDistanceCalculation: true,
        });

        setLocationLoading(false);
      } 
      else if (selectedTab === "AcceptedJob" || selectedTab === "AppliedJob" || selectedTab === "JobHistory") {
        showLoading();
        result = await JobApplicationService.getJobApplicationsByAccountId(
          jobSeekerId,
          selectedTab,
          page, // Use 1-based index for job applications
          pageSize
        );
      }
      else {
        showLoading();
        
        // Build search parameters with pagination
        const searchWithPagination = {
          ...searchPar,
          pageIndex: page - 1, // Convert to 0-based index for API
          pageSize: pageSize
        };
        
        result = await JobPostService.searchJobPosts(searchWithPagination);
      }

      if (result.success) {
        // Handle different response structures
        let rawData, totalCount;
        
        if (result.data && result.data.items) {
          // Standard paginated response
          rawData = result.data.items;
          totalCount = result.data.totalCount || result.data.total || 0;
        } else if (Array.isArray(result.data)) {
          // Simple array response
          rawData = result.data;
          totalCount = rawData.length;
        } else {
          rawData = [];
          totalCount = 0;
        }

        console.log(`API Response - Page ${page}, Total: ${totalCount}, Items: ${rawData.length}`);

        // Process the data: filter by distance (only for "Gợi Ý"), then filter by title, then sort
        const distanceFilteredData = filterJobsByDistance(rawData);
        const titleFilteredData = filterJobsByTitle(distanceFilteredData);
        const sortedData = sortJobData(titleFilteredData);

        // Update states
        setJobData(sortedData);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
        setCurrentPage(page);

        if (selectedTab === "Gợi Ý") {
          console.log(`Filtered to ${distanceFilteredData.length} jobs within 50km`);
        }

        if (searchInput && searchInput.trim()) {
          console.log(`Filtered to ${titleFilteredData.length} jobs matching "${searchInput}"`);
        }

      } else {
        console.error("Error fetching search results:", result.error);
        setJobData([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching job posts:", error);
      setJobData([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      hideLoading();
      setLocationLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    console.log("Page Index Changed:", page);
    fetchJobPosts(searchParams, page);
  };

  // Initial fetch and when dependencies change
  React.useEffect(() => {
    if (jobSeekerId) {
      // Reset to page 1 when tab or search changes
      fetchJobPosts(searchParams, 1);
    }
  }, [searchParams, selectedTab, jobSeekerId, searchInput]);

  // No data state
  if (!jobData || !Array.isArray(jobData) || jobData.length === 0) {
    const noDataMessage = () => {
      if (searchInput && searchInput.trim()) {
        return `Không tìm thấy công việc với từ khóa "${searchInput}"`;
      }
      return selectedTab === "Gợi Ý"
        ? "Không có công việc gợi ý trong vòng 50km."
        : "Không có dữ liệu công việc.";
    };

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, color: "gray", textAlign: "center" }}>
          {noDataMessage()}
        </Text>
      </View>
    );
  }

  // Helper functions (keep existing ones)
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

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchTerm.trim()})`, "gi");
    const parts = text.split(regex);

    return (
      <Text
        style={{ fontWeight: "bold", fontSize: 18, width: "80%" }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {parts.map((part, index) => (
          <Text
            key={index}
            style={{
              backgroundColor: regex.test(part) ? "#ffeb3b" : "transparent",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            {part}
          </Text>
        ))}
      </Text>
    );
  };

  return (
    <View style={{ flex: 1 }}>
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
            onPress={() => {
              navigate.navigate("JobDetail", {
                jobId: job.jobPostId,
              });
            }}
          >
            <Ionicons
              name="bookmark-outline"
              size={28}
              color="gray"
              style={{ position: "absolute", top: 15, right: 15 }}
            />
            <View style={{ flexDirection: "row", alignItems: "center", height: "50%" }}>
              <Image
                source={{ uri: job.companyLogo }}
                style={{
                  width: "17%",
                  height: "100%",
                  borderRadius: 100,
                  marginBottom: 10,
                  backgroundColor: "black",
                }}
                resizeMode="cover"
              />
              <View style={{ marginLeft: 10, width: "84%" }}>
                {searchInput && searchInput.trim() ? (
                  highlightSearchTerm(job.jobTitle, searchInput)
                ) : (
                  <Text
                    style={{ fontWeight: "bold", fontSize: 18, width: "80%" }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {job.jobTitle}
                  </Text>
                )}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: "gray", fontSize: 10 }}>{job.companyName}</Text>
                  <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
                  <Text style={{ color: "gray", fontSize: 10 }}>{getCity(job.jobLocation)}</Text>
                  <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
                  <Text style={{ color: "gray", fontSize: 10 }}>
                    {selectedTab === "Gợi Ý"
                      ? job.formattedDistance
                      : getTimeAgo(job.updatedAt)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 10 }}>
              <Text style={{ color: "#FF7345", fontSize: 20, fontWeight: "bold" }}>
                {job.salary?.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </Text>
              <Text style={{ color: "gray", fontSize: 20 }}>/</Text>
              <Text style={{ color: "gray", fontSize: 20, fontWeight: "bold" }}>
                {job.salaryUnit === "Day" ? "Ngày" : job.salaryUnit === "Shift" ? "Ca" : "Giờ"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 5, marginTop: "3%" }}>
              {[
                getExperienceRequirement(job.experienceRequirement) === "Không yêu cầu kinh nghiệm"
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

              {[
                getExperienceRequirement(job.experienceRequirement) === "Không yêu cầu kinh nghiệm"
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
                    +{[
                      getExperienceRequirement(job.experienceRequirement) === "Không yêu cầu kinh nghiệm"
                        ? "Không yêu cầu kinh nghiệm"
                        : "Yêu cầu kinh nghiệm",
                      job.isOutstandingPost ? "Cần gấp" : null,
                      getDistrict(job.jobLocation),
                      job.vacancyCount <= 5 ? `Còn ${job.vacancyCount} vị trí` : null,
                    ].filter(Boolean).length - 3}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'white' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>
              Trang {currentPage}/{totalPages}
            </Text>
            <Text style={{ fontSize: 14, color: '#666' }}>
              Tổng: {totalItems} kết quả
            </Text>
          </View>
          <Pagination 
            pageLength={totalPages}
            currentPage={currentPage}
            setPageIndex={handlePageChange}
          />
        </View>
      )}
    </View>
  );
};

export default JobCard;
