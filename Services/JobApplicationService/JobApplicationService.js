import api from "../api";

class JobApplicationService {
  static async applyForJob(jobPostId, accountId, cvFile) {
    try {
      if (!jobPostId || !accountId) {
        throw new Error("jobPostId, accountId are required");
      }
      const formData = new FormData();
      formData.append("cvFile", cvFile);
      const response = await api.post(
        `job-applications/apply?jobPostId=${jobPostId}&accountId=${accountId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in applyForJob:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi nộp đơn ứng tuyển.",
        status: error.response?.status,
      };
    }
  }

  static async getJobApplicationsByAccountId(
    jobSeekerId,
    myJobType = "JobHistory",
    pageIndex = 1,
    pageSize = 10
  ) {
    try {
      if (!jobSeekerId) {
        throw new Error("jobSeekerId is required");
      }

      const params = new URLSearchParams({
        jobSeekerId: jobSeekerId.toString(),
        myJobType,
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await api.get(`job-applications/my-job?${params}`);

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getJobApplicationsByAccountId:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi lấy danh sách đơn ứng tuyển.",
        status: error.response?.status,
      };
    }
  }

  // Alternative method with more specific naming
  static async getMyJobApplications(jobSeekerId, options = {}) {
    try {
      if (!jobSeekerId) {
        throw new Error("jobSeekerId is required");
      }

      const {
        myJobType = "JobHistory",
        pageIndex = 1,
        pageSize = 10,
      } = options;

      const params = new URLSearchParams({
        jobSeekerId: jobSeekerId.toString(),
        myJobType,
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await api.get(`job-applications/my-job?${params}`);

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getMyJobApplications:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi lấy danh sách đơn ứng tuyển.",
        status: error.response?.status,
      };
    }
  }
}

export default JobApplicationService;
