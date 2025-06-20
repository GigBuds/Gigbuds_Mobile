import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useCallback, useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import JobPostService from "../../Services/JobPostService/JobPostService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLoading } from "../../context/LoadingContext";
import JobApplicationService from "../../Services/JobApplicationService/JobApplicationService";

const JobCard = ({
  appliedFilters,
  marginBottom,
  searchParams,
  selectedTab,
  searchInput,
}) => {
  const { showLoading, hideLoading } = useLoading();

  const [jobData, setJobData] = React.useState([]);
  const [jobSeekerId, setJobSeekerId] = React.useState(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [hasMoreData, setHasMoreData] = React.useState(true);
  const [totalItems, setTotalItems] = React.useState(0);
  const [debouncedSearchInput, setDebouncedSearchInput] = React.useState(searchInput || "");
  const navigate = useNavigation();

  const PAGE_SIZE = 5;
  const DEBOUNCE_DELAY = 1000;
  const debounceTimerRef = useRef(null);
  const previousSearchInputRef = useRef(searchInput || "");

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

  // Debounce search input - only update if search input actually changed
  React.useEffect(() => {
    const currentSearchInput = searchInput || "";
    
    // Only proceed if search input actually changed
    if (previousSearchInputRef.current !== currentSearchInput) {
      previousSearchInputRef.current = currentSearchInput;
      
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchInput(currentSearchInput);
      }, DEBOUNCE_DELAY);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput]);

  // Helper function to extract distance in km
  const getDistanceInKm = (formattedDistance) => {
    if (!formattedDistance) return Infinity;

    // Remove all non-numeric and non-decimal characters, keep the number
    const numericValue = parseFloat(formattedDistance.replace(/[^\d.]/g, ""));

    // Check if the distance is in meters (contains 'm' but not 'km')
    if (formattedDistance.includes("m") && !formattedDistance.includes("km")) {
      return numericValue / 1000; // Convert meters to kilometers
    }

    // Otherwise assume it's in kilometers
    return numericValue || Infinity;
  };

  // Filter function to get jobs within 50km (only for "Gợi Ý" tab)
  const filterJobsByDistance = useCallback((jobs) => {
    if (!jobs || !Array.isArray(jobs)) return [];

    // Only filter for "Gợi Ý" tab
    if (selectedTab !== "Gợi Ý") {
      return jobs;
    }

    return jobs.filter((job) => {
      const distanceKm = getDistanceInKm(job.formattedDistance);
      return distanceKm <= 50;
    });
  }, [selectedTab]);

  // Updated filterJobsByTitle function - only for specific tabs
  const filterJobsByTitle = useCallback((jobs) => {
    // Only apply client-side filtering for specific tabs
    if (!jobs || !Array.isArray(jobs) || !debouncedSearchInput || !debouncedSearchInput.trim()) {
      return jobs;
    }

    const searchTerm = debouncedSearchInput.trim().toLowerCase();

    return jobs.filter((job) => {
      // Check if jobTitle contains the search term (case insensitive)
      const jobTitle = job.jobTitle?.toLowerCase() || "";
      return jobTitle.includes(searchTerm);
    });
  }, [debouncedSearchInput]);

  // Sort function based on selected tab
  const sortJobData = useCallback((jobs) => {
    if (!jobs || !Array.isArray(jobs)) return [];

    const sortedJobs = [...jobs]; // Create a copy to avoid mutating original array

    if (selectedTab === "Gợi Ý") {
      // Sort by formattedDistance (ascending - closest first)
      return sortedJobs.sort((a, b) => {
        const distanceA = getDistanceInKm(a.formattedDistance);
        const distanceB = getDistanceInKm(b.formattedDistance);
        return distanceA - distanceB;
      });
    } else {
      // Sort by updatedAt (descending - newest first)
      return sortedJobs.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0);
        const dateB = new Date(b.updatedAt || 0);
        return dateB - dateA; // Fixed: newest first
      });
    }
  }, [selectedTab]);

  const fetchJobPosts = useCallback(async (searchPar, page = 0, isLoadMore = false) => {
    try {
      let result;

      if (selectedTab === "Gợi Ý") {
        if (!isLoadMore) {
          showLoading();
          setLocationLoading(true);
        } else {
          setLoadingMore(true);
        }

        result = await JobPostService.getRecommendedJobPosts(jobSeekerId, {
          pageIndex: page + 1,
          pageSize: PAGE_SIZE,
          includeScheduleMatching: true,
          includeDistanceCalculation: true,
        });

        setLocationLoading(false);
      } else if (selectedTab === "AcceptedJob" || selectedTab === "AppliedJob" || selectedTab === "JobHistory") {
        if (!isLoadMore) {
          showLoading();
        } else {
          setLoadingMore(true);
        }
        result = await JobApplicationService.getJobApplicationsByAccountId(
          jobSeekerId,
          selectedTab,
          page + 1,
          PAGE_SIZE,
        );
      } else {
        if (!isLoadMore) {
          showLoading();
        } else {
          setLoadingMore(true);
        }
        
        // Add pagination and debouncedSearchInput to search params
        const paginatedSearchParams = {
          ...searchPar,
          pageIndex: page + 1,
          pageSize: PAGE_SIZE,
          // Add debouncedSearchInput as jobName if it exists
          ...(debouncedSearchInput && debouncedSearchInput.trim() && { jobName: debouncedSearchInput.trim() })
        };
        console.log("Paginated Search Params:", paginatedSearchParams);
        result = await JobPostService.searchJobPosts(paginatedSearchParams);
      }

      if (result.success) {
        const rawData = result.data.items || [];
        const totalCount = result.data.totalCount || result.data.total || 0;
        
        // For non-search tabs, apply client-side filtering
        // For search tabs, the API already handles jobName filtering
        let processedData = rawData;
        
        if (selectedTab === "Gợi Ý") {
          // Apply distance filtering only for "Gợi Ý" tab
          processedData = filterJobsByDistance(rawData);
          
          // Apply client-side title filtering for "Gợi Ý" tab if debouncedSearchInput exists
          if (debouncedSearchInput && debouncedSearchInput.trim()) {
            processedData = filterJobsByTitle(processedData);
          }
        } else if (selectedTab === "AcceptedJob" || selectedTab === "AppliedJob" || selectedTab === "JobHistory") {
          // Apply client-side title filtering for these tabs if debouncedSearchInput exists
          if (debouncedSearchInput && debouncedSearchInput.trim()) {
            processedData = filterJobsByTitle(rawData);
          }
        }
        // For other tabs (search), the API already handles jobName filtering, so no client-side filtering needed
        
        const sortedData = sortJobData(processedData);

        if (isLoadMore) {
          // Append new data to existing data
          setJobData(prevData => {
            // Remove duplicates based on job ID
            const existingIds = new Set(prevData.map(job => job.jobPostId || job.id));
            const newJobs = sortedData.filter(job => !existingIds.has(job.jobPostId || job.id));
            return [...prevData, ...newJobs];
          });
        } else {
          // Replace data for initial load or refresh
          setJobData(sortedData);
        }

        setTotalItems(totalCount);
        setCurrentPage(page);
        
        // FIXED LOGIC: Check if there's more data based on actual API response
        // If the API returns fewer items than PAGE_SIZE, it means we've reached the end
        const hasMore = rawData && rawData.length === PAGE_SIZE;
        setHasMoreData(hasMore);

        if (selectedTab === "Gợi Ý") {
          console.log(`Filtered to ${processedData.length} jobs within 50km`);
        }

        if (debouncedSearchInput && debouncedSearchInput.trim()) {
          console.log(`Jobs matching "${debouncedSearchInput}": ${processedData.length}`);
        }

        console.log(`Page ${page}: Loaded ${rawData.length} items, Total: ${totalCount}, HasMore: ${hasMore}`);
      } else {
        console.error("Error fetching search results:", result.error);
        if (!isLoadMore) {
          setJobData([]);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.error("Error fetching job posts:", error);
      if (!isLoadMore) {
        setJobData([]);
      }
      setHasMoreData(false);
    } finally {
      hideLoading();
      setLocationLoading(false);
      setLoadingMore(false);
    }
  }, [jobSeekerId, selectedTab, debouncedSearchInput, showLoading, hideLoading, filterJobsByDistance, filterJobsByTitle, sortJobData]);

  // Load more function - FIXED to properly increment page
  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    
    const nextPage = currentPage + 1;
    console.log(`Loading more jobs - Next page: ${nextPage}`);
    await fetchJobPosts(searchParams, nextPage, true);
  }, [loadingMore, hasMoreData, currentPage, searchParams, fetchJobPosts]);

  // Reset and fetch initial data
  const resetAndFetch = useCallback(async () => {
    console.log("Resetting pagination and fetching initial data");
    setCurrentPage(0);
    setHasMoreData(true);
    setJobData([]);
    await fetchJobPosts(searchParams, 0, false);
  }, [searchParams, fetchJobPosts]);

  // Effect for initial load and when dependencies change - FIXED TO PREVENT LOOPS
  React.useEffect(() => {
    if (!jobSeekerId) return; // Don't fetch if no user ID
    
    // Reset and fetch when key dependencies change
    resetAndFetch();
  }, [searchParams, selectedTab, jobSeekerId, debouncedSearchInput]); // Removed resetAndFetch from dependencies to prevent loop

  // Handle scroll to load more with improved threshold
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Increased threshold for better UX
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMoreData && !loadingMore) {
      loadMoreJobs();
    }
  }, [hasMoreData, loadingMore, loadMoreJobs]);

  // No data state
  if (!jobData || !Array.isArray(jobData) || jobData.length === 0) {
    // Don't show no data message while loading initial data
    if (locationLoading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <ActivityIndicator size="large" color="#FF7345" />
          <Text style={{ fontSize: 16, color: "gray", textAlign: "center", marginTop: 10 }}>
            Đang tải công việc...
          </Text>
        </View>
      );
    }

    const noDataMessage = () => {
      if (debouncedSearchInput && debouncedSearchInput.trim()) {
        return `Không tìm thấy công việc với từ khóa "${debouncedSearchInput}"`;
      }
      return selectedTab === "Gợi Ý"
        ? "Không có công việc gợi ý trong vòng 50km."
        : "Không có dữ liệu công việc.";
    };

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 16, color: "gray", textAlign: "center" }}>
          {noDataMessage()}
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

  // Highlight search term in job title
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
    <ScrollView 
      bouncesZoom={true} 
      style={{ marginBottom: marginBottom }}
      onScroll={handleScroll}
      scrollEventThrottle={16} // Reduced for better responsiveness
    >
      {jobData.map((job, index) => (
        <TouchableOpacity
          key={job.id || job.jobPostId || `job-${index}`}
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
              jobId: (selectedTab === "AcceptedJob" || selectedTab === "AppliedJob" || selectedTab === "JobHistory")
                ? job.id 
                : job.jobPostId || job.id
            });
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
                borderRadius: 100,
                marginBottom: 10,
                backgroundColor: "black",
              }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 10, width: "84%" }}>
              {/* Highlight search term in job title using debouncedSearchInput */}
              {debouncedSearchInput && debouncedSearchInput.trim() ? (
                highlightSearchTerm(job.jobTitle, debouncedSearchInput)
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
                <Text style={{ color: "gray", fontSize: 10 }}>
                  {job.companyName}
                </Text>
                <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
                <Text style={{ color: "gray", fontSize: 10 }}>
                  {getCity(job.jobLocation)}
                </Text>
                <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
                <Text style={{ color: "gray", fontSize: 10 }}>
                  {selectedTab === "Gợi Ý"
                    ? job.formattedDistance
                    : getTimeAgo(job.updatedAt)}
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
      
      {/* Load More Indicator */}
      {loadingMore && (
        <View style={{ 
          paddingVertical: 20, 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ActivityIndicator size="large" color="#FF7345" />
          <Text style={{ 
            marginTop: 10, 
            color: 'gray',
            fontSize: 14
          }}>
            Đang tải thêm công việc...
          </Text>
        </View>
      )}
      
      {/* End of List Indicator */}
      {!hasMoreData && jobData.length > 0 && (
        <View style={{ 
          paddingVertical: 20, 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ 
            color: 'gray',
            fontSize: 14,
            fontStyle: 'italic'
          }}>
            Đã hiển thị tất cả {jobData.length} công việc
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default JobCard;