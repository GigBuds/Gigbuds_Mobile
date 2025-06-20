import api from "../api";

class JobApplicationService {
  static async applyForJob(jobPostId, accountId, cvFile) {
    console.log("Applying for job with:", {
      jobPostId,
      accountId,
      cvFile,
    });
    try {
      if (!jobPostId || !accountId) {
        throw new Error("jobPostId, accountId are required");
      }
      const formData = new FormData();
      
      // Only append CV file if it exists (CV is now optional)
      if (cvFile) {
        formData.append("cvFile", cvFile);
      }
      
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
  static async checkIfApplied(jobPostId, accountId) {
    try {
      if (!jobPostId || !accountId) {
        throw new Error("jobPostId, accountId are required");
      }
      const response = await api.get(
        `job-applications/check-job-application/${jobPostId}/${accountId}`
      );
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in checkIfApplied:", error);
      if(error.response?.status === 409){
        console.info("Bạn đã ứng tuyển công việc này");
      }
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi kiểm tra đơn ứng tuyển.",
        status: error.response?.status,
      };
    }
  }
}

export default JobApplicationService;
