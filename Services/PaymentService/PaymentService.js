import api from "../api";

class PaymentService {
  static async createMembershipPayment(membershipId, userId, isMobile = true) {
    try {
      if (!membershipId || !userId) {
        throw new Error("membershipId and userId are required");
      }

      const paymentData = {
        membershipId: parseInt(membershipId),
        userId: parseInt(userId),
        isMobile: isMobile,
      };

      const response = await api.post('payments/memberships', paymentData);

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in createMembershipPayment:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.response?.data?.title ||
          error.message ||
          "Đã xảy ra lỗi khi thanh toán membership.",
        status: error.response?.status,
      };
    }
  }

  static async getPaymentStatus(paymentId) {
    try {
      if (!paymentId) {
        throw new Error("paymentId is required");
      }

      const response = await api.get(`payments/status/${paymentId}`);

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getPaymentStatus:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán.",
        status: error.response?.status,
      };
    }
  }

  static async getPaymentHistory(userId) {
    try {
      if (!userId) {
        throw new Error("userId is required");
      }

      const response = await api.get(`payments/history/${userId}`);

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getPaymentHistory:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi lấy lịch sử thanh toán.",
        status: error.response?.status,
      };
    }
  }
}

export default PaymentService; 