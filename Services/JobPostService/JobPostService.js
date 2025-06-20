import api from "../api";
import LocationService from "../LocationService/LocationService";

class JobPostService {
  static async searchJobPosts({
    companyName,
    jobName,
    salaryFrom,
    salaryTo,
    jobTimeFrom,
    jobTimeTo,
    salaryUnit,
    districtCodeList,
    jobPositionId,
  } = {}) {
    try {
      const params = new URLSearchParams();

      if (companyName) params.append("companyName", companyName);
      if (jobName) params.append("jobName", jobName);
      if (salaryFrom) params.append("salaryFrom", salaryFrom);
      if (salaryTo) params.append("salaryTo", salaryTo);
      if (jobTimeFrom) params.append("jobTimeFrom", jobTimeFrom);
      if (jobTimeTo) params.append("jobTimeTo", jobTimeTo);
      if (salaryUnit) params.append("salaryUnit", salaryUnit);
      if (jobPositionId) params.append("jobPositionId", jobPositionId);
      if (
        districtCodeList &&
        Array.isArray(districtCodeList) &&
        districtCodeList.length > 0
      ) {
        params.append("districtCodeList", districtCodeList.join(","));
      }

      const response = await api.get(`job-posts/search?${params.toString()}`);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi tìm kiếm công việc.",
        status: error.response?.status,
      };
    }
  }

  // Updated method to use centralized LocationService
  static async getRecommendedJobPosts(jobSeekerId, options = {}) {
    try {
      // jobSeekerId is required
      if (!jobSeekerId) {
        throw new Error("jobSeekerId is required");
      }

      // Get current location or use provided location using LocationService
      let currentLocation = options.currentLocation;

      if (!currentLocation) {
        console.log("🗺️ Getting current location for job recommendations...");
        currentLocation = await LocationService.getCurrentLocation();
      }

      const {
        pageIndex = 0,
        pageSize = 20,
        includeScheduleMatching = true,
        includeDistanceCalculation = true,
      } = options;

      const params = new URLSearchParams();

      if (currentLocation) params.append("currentLocation", currentLocation);
      if (pageIndex !== undefined) params.append("pageIndex", pageIndex);
      if (pageSize !== undefined) params.append("pageSize", pageSize);
      if (includeScheduleMatching !== undefined)
        params.append("includeScheduleMatching", includeScheduleMatching);
      if (includeDistanceCalculation !== undefined)
        params.append("includeDistanceCalculation", includeDistanceCalculation);

      console.log(
        "Recommendation API URL:",
        `job-posts/recommendations/${jobSeekerId}?${params.toString()}`
      );
      console.log("🗺️ Using location for recommendations:", currentLocation);

      const response = await api.get(
        `job-posts/recommendations/${jobSeekerId}?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getRecommendedJobPosts:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi lấy công việc gợi ý.",
        status: error.response?.status,
      };
    }
  }

  static async getJobPostById(jobPostId) {
    try {
      if (!jobPostId) {
        throw new Error("jobPostId is required");
      }

      const response = await api.get(`job-posts/${jobPostId}`);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getJobPostById:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi lấy thông tin công việc.",
        status: error.response?.status,
      };
    }
  }
}

export default JobPostService;
