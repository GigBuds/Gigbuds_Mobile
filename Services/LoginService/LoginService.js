import api from "../api";

class LoginService {
  // Login with email and password
  static async login(email, password) {
    try {
      const response = await api.post("identities/login", {
        identifier: email,
        password,
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.",
        status: error.response?.status
      };
    }
  }

  

  // Forgot password
  static async forgotPassword(email) {
    try {
      const response = await api.post("identities/forgot-password", {
        email,
      });
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Đã xảy ra lỗi khi gửi yêu cầu đặt lại mật khẩu.",
        status: error.response?.status
      };
    }
  }
}

export default LoginService;