import api from "../api";

class JobSeekerService {
    static async getJobSeekerById(id) {
        try {
            if (!id) {
                throw new Error('Job Seeker ID is required');
            }

            const response = await api.get(`job-seekers/${id}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getJobSeekerById:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy thông tin người tìm việc.",
                status: error.response?.status
            };
        }
    }
}

export default JobSeekerService;