import api from "../api.js";
import {
  ConversationMetadata,
  ChatHistory,
  ApiConversationResponse,
  ApiMessageResponse,
} from "../../types/messaging.types";

class MessagingApiService {
  // ==================== MESSAGING API ENDPOINTS ====================

  /**
   * Get conversation metadata for a user
   * Endpoint: GET /messages/conversation-metadata?userId={userId}
   */
  async getConversationMetadata(
    userId: number
  ): Promise<ConversationMetadata[]> {
    try {
      const response = await api.get(
        `/messages/conversation-metadata?userId=${userId}`
      );

      // Transform API response to our internal format
      return response.data.map((conv: ApiConversationResponse) => ({
        ...conv,
        timestamp: conv.timestamp ? new Date(conv.timestamp) : null,
      }));
    } catch (error) {
      console.error("❌ Failed to get conversation metadata:", error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation with pagination
   * Endpoint: GET /messages/conversation-messages?conversationId={id}&pageIndex={page}&pageSize={size}
   */
  async getConversationMessages(
    conversationId: number,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<ChatHistory[]> {
    try {
      const response = await api.get(
        `/messages/conversation-messages?conversationId=${conversationId}&pageIndex=${pageIndex}&pageSize=${pageSize}`
      );

      // Transform API response to our internal format
      return response.data.map((msg: ApiMessageResponse) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        isDeleted: msg.isDeleted || false,
      }));
    } catch (error) {
      console.error("❌ Failed to get conversation messages:", error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   * Endpoint: POST /messages/conversation-metadata
   */
  async createConversation(conversationData: {
    Members: Record<string, string>;
    CreatorId: string;
    ConversationNameOne: string;
    ConversationNameTwo: string;
    AvatarOne: string;
    AvatarTwo: string;
    CreatedAt: string;
  }): Promise<ConversationMetadata> {
    try {
      const response = await api.post(
        "/messages/conversation-metadata",
        conversationData
      );

      // Transform API response to our internal format
      const conv = response.data;
      return {
        ...conv,
        timestamp: conv.timestamp ? new Date(conv.timestamp) : null,
      };
    } catch (error) {
      console.error("❌ Failed to create conversation:", error);
      throw error;
    }
  }

  /**
   * Update a message (for editing)
   * Endpoint: PUT /messages/conversation-messages
   */
  async updateMessage(messageData: {
    messageId: string;
    content: string;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string;
    readByNames: string[];
    timestamp: Date;
    deliveryStatus: string;
    isDeleted: boolean;
  }): Promise<void> {
    try {
      await api.put("/messages/conversation-messages", {
        ...messageData,
        timestamp: messageData.timestamp.toISOString(),
      });
    } catch (error) {
      console.error("❌ Failed to update message:", error);
      throw error;
    }
  }

  /**
   * Delete a message
   * Endpoint: DELETE /messages/conversation-messages/{messageId}
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await api.delete(`/messages/conversation-messages/${messageId}`);
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      throw error;
    }
  }

  /**
   * Search for job seekers (users) by name for creating conversations
   * Endpoint: GET /job-seekers/names?name={query}&pageIndex={page}&pageSize={size}
   */
  async searchUsers(
    query: string,
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<{ userId: number; fullName: string; avatar?: string }[]> {
    try {
      const response = await api.get(
        `/job-seekers/names?name=${encodeURIComponent(
          query
        )}&pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Failed to search users:", error);
      throw error;
    }
  }

  // ==================== USER PROFILE API ENDPOINTS ====================

  /**
   * Get current user profile
   * Endpoint: GET /user/profile
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await api.get("/user/profile");
      return response.data;
    } catch (error) {
      console.error("❌ Failed to get user profile:", error);
      throw error;
    }
  }

  /**
   * Update user avatar
   * Endpoint: PUT /user/avatar
   */
  async updateUserAvatar(avatarData: FormData): Promise<{ avatarUrl: string }> {
    try {
      const response = await api.put("/user/avatar", avatarData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("❌ Failed to update user avatar:", error);
      throw error;
    }
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Mark conversation as read
   * Endpoint: PUT /messages/conversation-metadata/{conversationId}/read
   */
  async markConversationAsRead(conversationId: number): Promise<void> {
    try {
      await api.put(`/messages/conversation-metadata/${conversationId}/read`);
    } catch (error) {
      console.error("❌ Failed to mark conversation as read:", error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   * Endpoint: GET /messages/conversation-metadata/{conversationId}
   */
  async getConversationById(
    conversationId: number
  ): Promise<ConversationMetadata> {
    try {
      const response = await api.get(
        `/messages/conversation-metadata/${conversationId}`
      );

      const conv = response.data;
      return {
        ...conv,
        timestamp: conv.timestamp ? new Date(conv.timestamp) : null,
      };
    } catch (error) {
      console.error("❌ Failed to get conversation by ID:", error);
      throw error;
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Send message via HTTP (fallback when SignalR is not available)
   * Endpoint: POST /messages/conversation-messages
   */
  async sendMessage(
    messageData: Omit<ChatHistory, "messageId" | "timestamp">
  ): Promise<ChatHistory> {
    try {
      const response = await api.post("/messages/conversation-messages", {
        ...messageData,
        timestamp: new Date().toISOString(),
      });

      const msg = response.data;
      return {
        ...msg,
        timestamp: new Date(msg.timestamp),
        isDeleted: msg.isDeleted || false,
      };
    } catch (error) {
      console.error("❌ Failed to send message via HTTP:", error);
      throw error;
    }
  }

  /**
   * Get message by ID
   * Endpoint: GET /messages/conversation-messages/{messageId}
   */
  async getMessageById(messageId: string): Promise<ChatHistory> {
    try {
      const response = await api.get(
        `/messages/conversation-messages/${messageId}`
      );

      const msg = response.data;
      return {
        ...msg,
        timestamp: new Date(msg.timestamp),
        isDeleted: msg.isDeleted || false,
      };
    } catch (error) {
      console.error("❌ Failed to get message by ID:", error);
      throw error;
    }
  }
}

export const messagingApiService = new MessagingApiService();
