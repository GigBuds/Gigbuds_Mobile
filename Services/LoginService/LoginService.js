import api from "../api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";

class LoginService {
  // Login with email and password
  static async login(identifier, password) {
    try {
      const response = await api.post("identities/login", {
        identifier: identifier,
        password: password,
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.log("error", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.",
        status: error.response?.status,
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
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Đã xảy ra lỗi khi gửi yêu cầu đặt lại mật khẩu.",
        status: error.response?.status,
      };
    }
  }

  // Token Management Functions
  /**
   * Decodes a JWT token and returns the payload
   * @param {string} token - The JWT token to decode
   * @returns {Object} The decoded token payload
   */
  static decodeToken(token) {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Gets the user ID from the current access token
   * @returns {Promise<number|null>} The user ID or null if not found
   */
  static async getUserIdFromToken() {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        return null;
      }

      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error('Error getting user ID from token:', error);
      return null;
    }
  }

  /**
   * Extracts membership information from ID token
   * @param {string} idToken - The ID token to extract membership from
   * @returns {Array} Array of membership objects
   */
  static extractMembershipsFromToken(idToken) {
    try {
      const decoded = this.decodeToken(idToken);
      if (!decoded) return [];

      // Check if memberships claim exists
      if (decoded.memberships) {
        try {
          return JSON.parse(decoded.memberships);
        } catch (e) {
          console.error('Error parsing memberships from token:', e);
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('Error extracting memberships from token:', error);
      return [];
    } 
  }

  /**
   * Stores user information and membership data to AsyncStorage
   * @param {Object} userInfo - Decoded user information
   * @param {Array} memberships - Array of membership objects
   */
  static async storeUserInfo(userInfo, memberships = []) {
    try {
      console.log("Storing user info:", userInfo);
      console.log("Storing memberships:", memberships);
      
      // Store basic user info
      await AsyncStorage.setItem("userName", `${userInfo.family_name} ${userInfo.name}`);
      await AsyncStorage.setItem("userId", userInfo.sub);
      
      // Store membership information
      if (memberships.length > 0) {
        // Store the complete membership objects (no redundancy)
        await AsyncStorage.setItem("userMemberships", JSON.stringify(memberships));
        
        // Also store the primary/first membership for backward compatibility
        const primaryMembership = memberships[0];
        await AsyncStorage.setItem("membershipId", primaryMembership.MembershipId.toString());
        await AsyncStorage.setItem("membershipTitle", primaryMembership.Title);
      } else {
        // Clear membership data if no memberships
        await AsyncStorage.removeItem("userMemberships");
        await AsyncStorage.removeItem("membershipId");
        await AsyncStorage.removeItem("membershipTitle");
      }
      
      console.log("User info and memberships stored successfully.");
    } catch (error) {
      console.error("Error storing user info:", error);
    }
  }

  /**
   * Updates the stored ID token
   * @param {string} newIdToken - The new ID token to store
   * @returns {Promise<void>}
   */
  static async updateIdToken(newIdToken) {
    try {
      await AsyncStorage.setItem('userToken', newIdToken);
      console.log('🔄 ID token updated successfully');
      
      // Extract and store updated membership information
      const memberships = this.extractMembershipsFromToken(newIdToken);
      const userInfo = this.decodeToken(newIdToken);
      
      if (userInfo) {
        await this.storeUserInfo(userInfo, memberships);
      }
    } catch (error) {
      console.error('Error updating ID token:', error);
      throw error;
    }
  }

  /**
   * Gets the current ID token
   * @returns {Promise<string|null>} The current ID token or null
   */
  static async getIdToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Renews the ID token for the current user
   * @param {number} userId - The user ID to renew token for
   * @returns {Promise<string>} New ID token
   */
  static async renewIdToken(userId) {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await api.post(
        'Identities/renew-id-token',
        { userId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('🔄 Token renewed successfully');
      return response.data;
    } catch (error) {
      console.error('Error renewing ID token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Gets stored membership information
   * @returns {Promise<Object>} Object containing membership info
   */
  static async getMembershipInfo() {
    try {
      const membershipId = await AsyncStorage.getItem("membershipId");
      const membershipTitle = await AsyncStorage.getItem("membershipTitle");
      const memberships = await AsyncStorage.getItem("userMemberships");
      
      const membershipObjects = memberships ? JSON.parse(memberships) : [];
      
      return {
        // Primary membership (for backward compatibility)
        membershipId: membershipId ? parseInt(membershipId) : null,
        membershipTitle: membershipTitle || null,
        
        // All memberships - now just the complete objects without redundancy
        memberships: membershipObjects
      };
    } catch (error) {
      console.error('Error getting membership info:', error);
      return {
        membershipId: null,
        membershipTitle: null,
        memberships: []
      };
    }
  }
}

export default LoginService;
