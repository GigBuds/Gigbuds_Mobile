import api from "../api";

class FollowService {
  static async follow(userId, followedId) {
    try {
      if (!userId || !followedId) {
        throw new Error("User ID and Followed ID are required");
      }

      const response = await api.post(
        `follows/follow?userId=${userId}&followedUserId=${followedId}`
      );
      return {
        success: true,
        message: response.message || "Đã theo dõi thành công.",
      };
    } catch (error) {
      console.error("Error in follow:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi theo dõi.",
        status: error.response?.status,
      };
    }
  }
  static async unfollow(userId, followedId) {
    try {
      if (!userId || !followedId) {
        throw new Error("User ID and Followed ID are required");
      }

      const response = await api.delete(
        `follows/unfollow?userId=${userId}&followedUserId=${followedId}`
      );
      return {
        success: true,
        message: response.message || "Đã hủy theo dõi thành công.",
      };
    } catch (error) {
      console.error("Error in unfollow:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi hủy theo dõi.",
        status: error.response?.status,
      };
    }
  }

  static async getFollowers(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const response = await api.get(`follows/all-followers/${userId}`);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error in getFollowers:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi lấy danh sách người theo dõi.",
        status: error.response?.status,
      };
    }
  }
}
export default FollowService;
