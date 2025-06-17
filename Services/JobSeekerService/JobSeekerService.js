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

    static async updateJobSeeker(id, data) {
        try {
            if (!id || !data) {
                throw new Error('Job Seeker ID and data are required');
            }

            const response = await api.put(`job-seekers/${id}`, data);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in updateJobSeeker:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi cập nhật thông tin người tìm việc.",
                status: error.response?.status
            };
        }
    }

    static async getSkillTags () {
        try {
            const response = await api.get('skill-tags');
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getSkillTags:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy danh sách kỹ năng.",
                status: error.response?.status
            };
        }
    }
}

export default JobSeekerService;