import { useCallback, useRef } from 'react';
import JobApplicationService from '../../../Services/JobApplicationService/JobApplicationService';
import JobPostService from '../../../Services/JobPostService/JobPostService';

export const useJobData = (showLoading, hideLoading) => {
  const debounceTimerRef = useRef(null);
  const previousSearchInputRef = useRef("");

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
  const filterJobsByDistance = useCallback((jobs, selectedTab) => {
    if (!jobs || !Array.isArray(jobs) || selectedTab !== "Gợi Ý") {
      return jobs;
    }
    return jobs.filter((job) => {
      const distanceKm = getDistanceInKm(job.formattedDistance);
      return distanceKm <= 50;
    });
  }, []);

  // Filter jobs by title
  const filterJobsByTitle = useCallback((jobs, searchTerm) => {
    if (!jobs || !Array.isArray(jobs) || !searchTerm?.trim()) {
      return jobs;
    }
    const searchTermLower = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      const jobTitle = job.jobTitle?.toLowerCase() || "";
      return jobTitle.includes(searchTermLower);
    });
  }, []);

  // Sort function based on selected tab
  const sortJobData = useCallback((jobs, selectedTab) => {
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
        return dateB - dateA;
      });
    }
  }, []);

  // Fetch job posts
  const fetchJobPosts = useCallback(async (params) => {
    const {
      searchParams,
      selectedTab,
      jobSeekerId,
      employerId,
      debouncedSearchInput,
      page = 0,
      pageSize = 5,
      isLoadMore = false
    } = params;

    try {
      let result;

      if (!isLoadMore) {
        showLoading();
      }

      // Determine which API to call based on selectedTab
      if (selectedTab === "Gợi Ý") {
        result = await JobPostService.searchJobPosts();
      } else if (["AcceptedJob", "AppliedJob", "JobHistory"].includes(selectedTab)) {
        result = await JobApplicationService.getJobApplicationsByAccountId(
          jobSeekerId,
          selectedTab,
          page + 1,
          pageSize
        );
      } else if (selectedTab === "EmployerJob") {
        result = await JobPostService.getJobPostsByCompanyId(employerId, {
          pageIndex: page + 1,
          pageSize: pageSize,
        });
      } else {
        // Default search
        const paginatedSearchParams = {
          ...searchParams,
          pageIndex: page + 1,
          pageSize: pageSize,
          ...(debouncedSearchInput?.trim() && { jobName: debouncedSearchInput.trim() })
        };
        result = await JobPostService.searchJobPosts(paginatedSearchParams);
      }

      if (result.success) {
        const rawData = result.data.items || [];
        const totalCount = result.data.totalCount || result.data.total || 0;
        
        // Apply filters
        let processedData = rawData;
        
        if (selectedTab === "Gợi Ý") {
          processedData = filterJobsByDistance(rawData, selectedTab);
          if (debouncedSearchInput?.trim()) {
            processedData = filterJobsByTitle(processedData, debouncedSearchInput);
          }
        } else if (["AcceptedJob", "AppliedJob", "JobHistory", "EmployerJob"].includes(selectedTab)) {
          if (debouncedSearchInput?.trim()) {
            processedData = filterJobsByTitle(rawData, debouncedSearchInput);
          }
        }
        
        const sortedData = sortJobData(processedData, selectedTab);
        const hasMore = rawData && rawData.length === pageSize;

        return {
          success: true,
          data: sortedData,
          totalCount,
          hasMore,
          page
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error("Error fetching job posts:", error);
      return { success: false, error: error.message };
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading, filterJobsByDistance, filterJobsByTitle, sortJobData]);

  return {
    fetchJobPosts,
    debounceTimerRef,
    previousSearchInputRef
  };
};
