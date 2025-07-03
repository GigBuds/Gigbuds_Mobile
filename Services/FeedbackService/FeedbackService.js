import api from "../api";

class FeedbackService {
    static async getFeedbacksByAccountId(accountId, feedbackType = "All") {
        try {
            if (!accountId) {
                throw new Error('Account ID is required');
            }

            // Add pagination parameters to get all feedbacks (using a large page size)
            const response = await api.get(`feedbacks/account/${accountId}?feedbackType=${feedbackType}&pageIndex=1&pageSize=100`);
            
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getFeedbacksByAccountId:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy danh sách đánh giá.",
                status: error.response?.status
            };
        }
    }

    static async getAllFeedbacks(feedbackType = "All", page = 1, pageSize = 10) {
        try {
            const response = await api.get(`feedbacks?feedbackType=${feedbackType}&page=${page}&pageSize=${pageSize}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getAllFeedbacks:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy danh sách đánh giá.",
                status: error.response?.status
            };
        }
    }

    static async getFeedbackById(feedbackId) {
        try {
            if (!feedbackId) {
                throw new Error('Feedback ID is required');
            }

            const response = await api.get(`feedbacks/${feedbackId}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in getFeedbackById:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy thông tin đánh giá.",
                status: error.response?.status
            };
        }
    }

    static async createFeedback(feedbackData) {
        try {
            if (!feedbackData) {
                throw new Error('Feedback data is required');
            }

            const response = await api.post('feedbacks', feedbackData);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            console.error('Error in createFeedback:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi tạo đánh giá.",
                status: error.response?.status
            };
        }
    }
}

export default FeedbackService; 