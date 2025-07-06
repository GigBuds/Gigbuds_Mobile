import api from "../api";

class EmployerService {
    static async getEmployerProfile(id) {
        try {
            if (!id) {
                throw new Error('Employer ID is required');
            }

            const response = await api.get(`employer-profiles/${id}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getEmployerProfile:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy thông tin nhà tuyển dụng.",
                status: error.response?.status
            };
        }
    }



    static async getEmployerJobPosts(id, page = 1, pageSize = 10) {
        try {
            if (!id) {
                throw new Error('Employer ID is required');
            }

            const response = await api.get(`employer-profiles/${id}/job-posts?page=${page}&pageSize=${pageSize}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getEmployerJobPosts:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy danh sách công việc.",
                status: error.response?.status
            };
        }
    }
}

export default EmployerService; 