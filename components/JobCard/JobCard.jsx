import { View, ScrollView, Text, ActivityIndicator } from "react-native";
import React, { useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLoading } from "../../context/LoadingContext";
import { useJobData } from "./hooks/useJobData";
import JobCardItem from "./JobCardItem";
import JobCardLoadingStates from "./JobCardLoadingStates";
import { getDistrict, getExperienceRequirement, getTimeAgo, getCity, getJobId } from "./utils/jobCardUtils";

const JobCard = ({
  appliedFilters,
  marginBottom,
  searchParams,
  selectedTab,
  searchInput,
  employerId,
}) => {
  const { showLoading, hideLoading } = useLoading();
  const { fetchJobPosts, debounceTimerRef, previousSearchInputRef } = useJobData(showLoading, hideLoading);
  const navigate = useNavigation();

  // State management
  const [jobData, setJobData] = React.useState([]);
  const [jobSeekerId, setJobSeekerId] = React.useState(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [hasMoreData, setHasMoreData] = React.useState(true);
  const [totalItems, setTotalItems] = React.useState(0);
  const [debouncedSearchInput, setDebouncedSearchInput] = React.useState(searchInput || "");

  // Constants
  const PAGE_SIZE = 5;
  const DEBOUNCE_DELAY = 1000;

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
  // Debounce search input
  React.useEffect(() => {
    const currentSearchInput = searchInput || "";
    
    if (previousSearchInputRef.current !== currentSearchInput) {
      previousSearchInputRef.current = currentSearchInput;
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchInput(currentSearchInput);
      }, DEBOUNCE_DELAY);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, DEBOUNCE_DELAY]);

  // Fetch job posts with new hook
  const handleFetchJobPosts = useCallback(async (page = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLocationLoading(true);
    }

    const result = await fetchJobPosts({
      searchParams,
      selectedTab,
      jobSeekerId,
      employerId,
      debouncedSearchInput,
      page,
      pageSize: PAGE_SIZE,
      isLoadMore
    });

    if (result.success) {
      if (isLoadMore) {
        setJobData(prevData => {
          const existingIds = new Set(prevData.map(job => job.jobPostId || job.id));
          const newJobs = result.data.filter(job => !existingIds.has(job.jobPostId || job.id));
          return [...prevData, ...newJobs];
        });
      } else {
        setJobData(result.data);
      }

      setTotalItems(result.totalCount);
      setCurrentPage(result.page);
      setHasMoreData(result.hasMore);
    } else {
      console.error("Error fetching job posts:", result.error);
      if (!isLoadMore) {
        setJobData([]);
      }
      setHasMoreData(false);
    }

    setLocationLoading(false);
    setLoadingMore(false);
  }, [fetchJobPosts, searchParams, selectedTab, jobSeekerId, employerId, debouncedSearchInput, PAGE_SIZE]);
  // Load more function
  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    
    const nextPage = currentPage + 1;
    console.log(`Loading more jobs - Next page: ${nextPage}`);
    await handleFetchJobPosts(nextPage, true);
  }, [loadingMore, hasMoreData, currentPage, handleFetchJobPosts]);

  // Reset and fetch initial data
  const resetAndFetch = useCallback(async () => {
    console.log("Resetting pagination and fetching initial data");
    setCurrentPage(0);
    setHasMoreData(true);
    setJobData([]);
    await handleFetchJobPosts(0, false);
  }, [handleFetchJobPosts]);

  // Effect for initial load and dependencies
  React.useEffect(() => {
    if (!jobSeekerId) return;
    resetAndFetch();
  }, [searchParams, selectedTab, jobSeekerId, debouncedSearchInput]);

  // Handle scroll to load more
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom && hasMoreData && !loadingMore) {
      loadMoreJobs();
    }
  }, [hasMoreData, loadingMore, loadMoreJobs]);
  // Show loading or no data states
  if (locationLoading) {
    return (
      <JobCardLoadingStates
        locationLoading={locationLoading}
        loadingMore={loadingMore}
        hasMoreData={hasMoreData}
        jobDataLength={jobData.length}
        debouncedSearchInput={debouncedSearchInput}
        selectedTab={selectedTab}
      />
    );
  }

  if (!jobData || jobData.length === 0) {
    return (
      <JobCardLoadingStates
        locationLoading={locationLoading}
        loadingMore={loadingMore}
        hasMoreData={hasMoreData}
        jobDataLength={jobData.length}
        debouncedSearchInput={debouncedSearchInput}
        selectedTab={selectedTab}
      />
    );
  }
  return (
    <>
    <ScrollView 
      bouncesZoom={true} 
      style={{ marginBottom: marginBottom }}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {jobData.map((job, index) => (
        <JobCardItem
          key={job.id || job.jobPostId || `job-${index}`}
          job={job}
          index={index}
          selectedTab={selectedTab}
          debouncedSearchInput={debouncedSearchInput}
          onPress={() => {
            navigate.navigate("JobDetail", {
              jobId: getJobId(job, selectedTab)
            });
          }}
          getCity={getCity}
          getTimeAgo={getTimeAgo}
          getDistrict={getDistrict}
          getExperienceRequirement={getExperienceRequirement}
        />      
      ))}

      {/* Load More Indicator */}
      {loadingMore && (
        <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FF7345" />
          <Text style={{ marginTop: 10, color: 'gray', fontSize: 14 }}>
            Đang tải thêm công việc...
          </Text>
        </View>
      )}

      {/* End of List Indicator */}
      {!hasMoreData && jobData.length > 0 && (
        <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'gray', fontSize: 14, fontStyle: 'italic' }}>
            Đã hiển thị tất cả {jobData.length} công việc
          </Text>
        </View>
      )}
      </ScrollView>

      <FeedbackDialog
        visible={feedbackDialogVisible}
        onClose={handleCloseFeedbackDialog}
        jobData={selectedJobForFeedback}
        jobSeekerId={jobSeekerId}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </>
  );
};

export default JobCard;