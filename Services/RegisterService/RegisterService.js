import api from "../api";

class RegisterService {
  // Register a new user
  static async register(userData) {
    try {
      const response = await api.post("identities/register", userData);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.",
        status: error.response?.status
      };
    }
  }

 // Verify OTP
  static async verifyOTP(phoneNumber, verificationCode) {
    try {
      const response = await api.post("identities/verify-phone", {
        phoneNumber,
        verificationCode,
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Đã xảy ra lỗi khi xác thực mã OTP. Vui lòng thử lại.",
        status: error.response?.status
      };
    }
  }

  // Resend OTP
  static async resendOTP(phoneNumber) {
    try {
      const response = await api.post("identities/resend-otp", {
        phoneNumber,
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Đã xảy ra lỗi khi gửi lại mã OTP. Vui lòng thử lại.",
        status: error.response?.status
      };
    }
  }
}

export default RegisterService;