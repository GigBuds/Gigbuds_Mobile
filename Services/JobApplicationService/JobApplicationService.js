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
}

export default JobApplicationService;
