import api from "../api.js";

/**
 * API SERVICE FOR MESSAGING SYSTEM
 *
 * This service handles all HTTP API requests for the messaging system:
 * - Uses existing api.js configuration with EXPO_PUBLIC_LOCAL_API_URL
 * - Conversation metadata operations
 * - Message CRUD operations
 * - Error handling and retry logic
 *
 * Server Endpoints:
 * - GET /messages/conversation-metadata - Get user's conversations
 * - GET /messages/conversation-messages - Get messages with pagination
 * - POST /messages/conversation-metadata - Create new conversation
 * - PUT /messages/conversation-messages - Update/edit message
 * - DELETE /messages/conversation-messages/{messageId} - Delete message
 */

class ApiService {
  constructor() {
    this.api = api; // Use the existing configured axios instance
    this.isOnline = true;
    this.baseUrl = api.defaults.baseURL;
  }

  /**
   * Generic request method with error handling
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data (for POST/PUT)
   * @param {Object} params - Query parameters
   * @returns {Promise} API response data
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
      const config = {
        method,
        url: endpoint,
        ...(data && { data }),
        ...(params && { params }),
      };

      // Build complete URL for logging
      let fullUrl = endpoint;
      if (params && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        fullUrl = `${endpoint}?${queryString}`;
      }

      console.log(`🌐 API Request: ${method.toUpperCase()} ${fullUrl}`);

      // Log request body if present
      if (data) {
        console.log(`📤 Request Body:`, data);
      }

      const response = await this.api(config);

      console.log(`✅ API Response: ${response.status} ${fullUrl}`);
      return response.data;
    } catch (error) {
      // Enhanced error handling
      if (error.code === "NETWORK_ERROR" || error.code === "ECONNABORTED") {
        this.isOnline = false;
        throw new Error(
          "Network connection failed. Please check your internet connection."
        );
      }

      // Build URL for error logging
      let errorUrl = endpoint;
      if (params && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        errorUrl = `${endpoint}?${queryString}`;
      }

      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        console.error(
          `❌ API Error ${status} for ${method.toUpperCase()} ${errorUrl}:`,
          data
        );
        throw new Error(
          `Server error (${status}): ${
            data?.message || data || "Unknown error"
          }`
        );
      }

      console.error(
        `❌ API Request failed for ${method.toUpperCase()} ${errorUrl}:`,
        error.message
      );
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  // ==================== CONVERSATION API ENDPOINTS ====================

  /**
   * Get conversation metadata for a user
   * Endpoint: GET /messages/conversation-metadata?userId={userId}&searchTerm={term}&pageIndex={page}&pageSize={size}
   * @param {number} userId - ID of the user (-1 for all)
   * @param {Object} options - Additional query options
   * @param {string} options.searchTerm - Search term for conversation names (optional)
   * @param {number} options.pageIndex - Page number (1-based, default: 1)
   * @param {number} options.pageSize - Items per page (max: 20, default: 5)
   * @returns {Promise<Object>} PagedResultDto with conversation metadata
   */
  async getConversationMetadata(userId, options = {}) {
    try {
      const { searchTerm = null, pageIndex = 1, pageSize = 5 } = options;

      console.log(
        `📋 Fetching conversation metadata for user ${userId} (page ${pageIndex}${
          searchTerm ? `, search: "${searchTerm}"` : ""
        })`
      );

      const queryParams = {
        userId,
        pageIndex,
        pageSize,
      };

      if (searchTerm) {
        queryParams.searchTerm = searchTerm;
      }

      const response = await this.makeRequest(
        "GET",
        "/messages/conversation-metadata",
        null,
        queryParams
      );

      // Handle PagedResultDto<ConversationMetaDataDto> format
      const conversations = response?.data || [];
      const totalCount = response?.count || 0;

      // Normalize conversation data according to API specification
      const normalizedConversations = conversations.map((conv) => ({
        id: String(conv.id), // Keep as string (Redis format: "conv_123")
        creatorId: Number(conv.creatorId),
        nameOne: conv.nameOne || "",
        nameTwo: conv.nameTwo || "",
        avatarOne: conv.avatarOne || "",
        avatarTwo: conv.avatarTwo || "",
        lastMessage: conv.lastMessage || "",
        lastMessageSenderName: conv.lastMessageSenderName || "",
        lastMessageId: conv.lastMessageId || "",
        timestamp: conv.timestamp ? new Date(conv.timestamp) : new Date(),
        isOnline: Boolean(conv.isOnline),
        whosTyping: Array.isArray(conv.whosTyping) ? conv.whosTyping : [],
        memberIds: Array.isArray(conv.memberIds) ? conv.memberIds : [],
        members: Array.isArray(conv.members)
          ? conv.members.map((member) => ({
              userId: Number(member.userId),
              userName: member.userName || "",
            }))
          : [],
        // Legacy fields for compatibility
        newMessageUnread: Boolean(conv.lastMessage && conv.lastMessage !== ""),
      }));

      console.log(
        `✅ Retrieved ${normalizedConversations.length}/${totalCount} conversations`
      );

      return {
        count: totalCount,
        data: normalizedConversations,
        pageIndex,
        pageSize,
      };
    } catch (error) {
      console.error("❌ Failed to get conversation metadata:", error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation with pagination
   * Endpoint: GET /messages/conversation-messages?conversationId={id}&searchTerm={term}&pageIndex={page}&pageSize={size}
   * @param {number} conversationId - ID of the conversation
   * @param {Object} options - Additional query options
   * @param {string} options.searchTerm - Search term for message content (optional)
   * @param {number} options.pageIndex - Page number (1-based, default: 1)
   * @param {number} options.pageSize - Items per page (max: 20, default: 5)
   * @returns {Promise<Object>} PagedResultDto with message objects
   */
  async getConversationMessages(conversationId, options = {}) {
    try {
      const { searchTerm = null, pageIndex = 1, pageSize = 5 } = options;

      console.log(
        `💬 Fetching messages for conversation ${conversationId} (page ${pageIndex}${
          searchTerm ? `, search: "${searchTerm}"` : ""
        })`
      );

      const queryParams = {
        conversationId: Number(conversationId),
        pageIndex,
        pageSize,
      };

      if (searchTerm) {
        queryParams.searchTerm = searchTerm;
      }

      const response = await api.get(
        `/messages/conversation-messages?conversationId=${conversationId}&pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      console.log("💬 API Response:", response.data);

      // Handle PagedResultDto<ChatHistoryDto> format
      const messages = response?.data?.data || [];
      const totalCount = response?.data?.count || 0;

      // Normalize message data according to ChatHistoryDto specification
      const normalizedMessages = messages.map((msg) => ({
        messageId: String(msg.messageId), // Keep as string (Redis format: "msg_123")
        conversationId: Number(msg.conversationId),
        senderId: Number(msg.senderId),
        senderName: msg.senderName || "",
        senderAvatar: msg.senderAvatar || "",
        readByNames: Array.isArray(msg.readByNames) ? msg.readByNames : [],
        isDeleted: Boolean(msg.isDeleted),
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        deliveryStatus: msg.deliveryStatus || 0, // 0=Sending, 1=Delivered, 2=Read, 3=Failed
        content: msg.content || "",
        // Legacy field for compatibility
        messageContent: msg.content || "",
      }));

      console.log(
        `✅ Retrieved ${normalizedMessages.length}/${totalCount} messages`
      );

      return {
        count: totalCount,
        data: normalizedMessages,
        pageIndex,
        pageSize,
      };
    } catch (error) {
      console.error(
        `❌ Failed to get messages for conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create a new conversation
   * Endpoint: POST /messages/conversation-metadata
   * @param {Object} conversationData - Conversation creation data
   * @param {Object} conversationData.members - Dictionary of member ID to display name mapping
   * @param {string|number} conversationData.creatorId - ID of user creating the conversation
   * @param {string} conversationData.conversationNameOne - Display name for first participant
   * @param {string} conversationData.conversationNameTwo - Display name for second participant
   * @param {string} conversationData.avatarOne - Avatar URL for first participant
   * @param {string} conversationData.avatarTwo - Avatar URL for second participant
   * @returns {Promise<Object>} Created conversation metadata (ConversationMetaDataDto)
   */
  async createConversation(conversationData) {
    try {
      console.log("🆕 Creating new conversation");

      // Validate conversation data before creating
      this.validateConversationData(conversationData);

      // Format data according to CreateConversationCommand specification
      const createCommand = {
        members: conversationData.members || {}, // Dictionary<int, string>
        creatorId: String(conversationData.creatorId), // string
        conversationNameOne:
          conversationData.conversationNameOne ||
          conversationData.nameOne ||
          "",
        conversationNameTwo:
          conversationData.conversationNameTwo ||
          conversationData.nameTwo ||
          "",
        avatarOne: conversationData.avatarOne || "",
        avatarTwo: conversationData.avatarTwo || "",
        createdAt: new Date().toISOString(),
      };

      const response = await this.makeRequest(
        "POST",
        "/messages/conversation-metadata",
        createCommand
      );

      // Handle ConversationMetaDataDto response format
      const conversation =
        response && typeof response === "object" ? response : {};

      // Normalize response according to ConversationMetaDataDto specification
      const normalizedConversation = {
        id: String(conversation.id), // Keep as string (Redis format)
        creatorId: Number(conversation.creatorId),
        nameOne: conversation.nameOne || "",
        nameTwo: conversation.nameTwo || "",
        avatarOne: conversation.avatarOne || "",
        avatarTwo: conversation.avatarTwo || "",
        lastMessage: conversation.lastMessage || "",
        lastMessageSenderName: conversation.lastMessageSenderName || "",
        lastMessageId: conversation.lastMessageId || "",
        timestamp: conversation.timestamp
          ? new Date(conversation.timestamp)
          : new Date(),
        isOnline: Boolean(conversation.isOnline),
        whosTyping: Array.isArray(conversation.whosTyping)
          ? conversation.whosTyping
          : [],
        memberIds: Array.isArray(conversation.memberIds)
          ? conversation.memberIds
          : [],
        members: Array.isArray(conversation.members)
          ? conversation.members.map((member) => ({
              userId: Number(member.userId),
              userName: member.userName || "",
            }))
          : [],
        // Legacy fields for compatibility
        newMessageUnread: false,
      };

      console.log(`✅ Created conversation ${normalizedConversation.id}`);
      return normalizedConversation;
    } catch (error) {
      console.error("❌ Failed to create conversation:", error);
      throw error;
    }
  }

  // ==================== MESSAGE API ENDPOINTS ====================

  /**
   * Update a message (for editing)
   * Endpoint: PUT /messages/conversation-messages
   * @param {Object} messageData - Updated message data (ChatHistoryDto format)
   * @param {string} messageData.messageId - ID of message to update
   * @param {number} messageData.conversationId - Parent conversation ID
   * @param {number} messageData.senderId - Original sender ID
   * @param {string} messageData.senderName - Sender display name
   * @param {string} messageData.senderAvatar - Sender avatar URL
   * @param {string[]} messageData.readByNames - Updated read receipts
   * @param {boolean} messageData.isDeleted - Deletion status
   * @param {Date|string} messageData.timestamp - Original timestamp
   * @param {number} messageData.deliveryStatus - Updated delivery status (0=Sending, 1=Delivered, 2=Read, 3=Failed)
   * @param {string} messageData.content - Updated message content
   * @returns {Promise<void>}
   */
  async updateMessage(messageData) {
    try {
      console.log(`✏️ Updating message ${messageData.messageId}`);

      // Validate message data before updating
      this.validateMessageData(messageData);

      // Format message data according to ChatHistoryDto specification
      const chatHistoryDto = {
        messageId: String(messageData.messageId),
        conversationId: Number(messageData.conversationId),
        senderId: Number(messageData.senderId),
        senderName: messageData.senderName || "",
        senderAvatar: messageData.senderAvatar || "",
        readByNames: Array.isArray(messageData.readByNames)
          ? messageData.readByNames
          : [],
        isDeleted: Boolean(messageData.isDeleted),
        timestamp:
          messageData.timestamp instanceof Date
            ? messageData.timestamp.toISOString()
            : messageData.timestamp || new Date().toISOString(),
        deliveryStatus: Number(messageData.deliveryStatus) || 0, // Default to "Sending"
        content: messageData.content || messageData.messageContent || "",
      };

      await this.makeRequest(
        "PUT",
        "/messages/conversation-messages",
        chatHistoryDto
      );

      console.log(`✅ Message ${messageData.messageId} updated successfully`);
    } catch (error) {
      console.error(
        `❌ Failed to update message ${messageData.messageId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete a message
   * Endpoint: DELETE /messages/conversation-messages/{messageId}
   * @param {string|number} messageId - ID of the message to delete
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId) {
    try {
      console.log(`🗑️ Deleting message ${messageId}`);

      await this.makeRequest(
        "DELETE",
        `/messages/conversation-messages/${messageId}`
      );

      console.log(`✅ Message ${messageId} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete message ${messageId}:`, error);
      throw error;
    }
  }

  // ==================== USER SEARCH API ENDPOINTS ====================

  /**
   * Search for job seekers (users) by name for creating conversations
   * Endpoint: GET /job-seekers/names?name={query}&pageIndex={page}&pageSize={size}
   * @param {string} query - Search query (user name)
   * @param {number} pageIndex - Page number (1-based)
   * @param {number} pageSize - Number of results per page
   * @returns {Promise<Array>} Array of user objects with userId, fullName, avatar
   */
  async searchUsers(query, pageIndex = 1, pageSize = 10) {
    try {
      console.log(`🔍 Searching users with query: "${query}"`);

      const response = await this.makeRequest(
        "GET",
        "/employer-profiles/names",
        null,
        {
          name: encodeURIComponent(query),
          pageIndex,
          pageSize,
        }
      );

      // Handle different possible response structures from the backend
      let users;
      if (Array.isArray(response)) {
        users = response;
      } else if (response && Array.isArray(response.data)) {
        users = response.data;
      } else if (response && Array.isArray(response.users)) {
        users = response.users;
      } else if (response && Array.isArray(response.items)) {
        users = response.items;
      } else {
        console.warn("⚠️ Unexpected user search response format:", response);
        users = [];
      }

      // Normalize user data to a consistent format
      const normalizedUsers = users.map((user) => ({
        userId: Number(user.userId),
        fullName: user.fullName,
        avatar: user.avatar || null,
      }));

      console.log(
        `✅ Found ${normalizedUsers.length} users matching "${query}"`
      );
      return normalizedUsers;
    } catch (error) {
      console.error(`❌ Failed to search users for "${query}":`, error);
      throw error;
    }
  }

  // ==================== USER PROFILE API ENDPOINTS ====================

  /**
   * Get current user profile
   * Endpoint: GET /user/profile
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile() {
    try {
      console.log("👤 Fetching user profile");

      const response = await this.makeRequest("GET", "/user/profile");

      // Handle response format
      const user = response && typeof response === "object" ? response : {};

      // Normalize user data
      const normalizedUser = {
        id: Number(user.id),
        name: user.name || user.fullName,
        email: user.email,
        avatar: user.avatar || null,
        phoneNumber: user.phoneNumber || null,
      };

      console.log(`✅ Retrieved profile for user ${normalizedUser.id}`);
      return normalizedUser;
    } catch (error) {
      console.error("❌ Failed to get user profile:", error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * DeliveryStatus enum values according to API specification
   */
  static DeliveryStatus = {
    SENDING: 0,
    DELIVERED: 1,
    READ: 2,
    FAILED: 3,
  };

  /**
   * Get human-readable delivery status
   * @param {number} status - Delivery status code
   * @returns {string} Human-readable status
   */
  getDeliveryStatusText(status) {
    switch (Number(status)) {
      case 0:
        return "Sending";
      case 1:
        return "Delivered";
      case 2:
        return "Read";
      case 3:
        return "Failed";
      default:
        return "Unknown";
    }
  }

  /**
   * Check if the API is reachable (connectivity test)
   * @returns {Promise<boolean>} True if API is reachable
   */
  async checkConnectivity() {
    try {
      console.log("🔗 Checking API connectivity");

      // Try to get conversation metadata as a connectivity test
      await this.makeRequest("GET", "/messages/conversation-metadata", null, {
        userId: 1,
        pageIndex: 1,
        pageSize: 1,
      });
      this.isOnline = true;

      console.log("✅ API is reachable");
      return true;
    } catch (error) {
      console.warn("⚠️ API is not reachable:", error.message);
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Get the current online status
   * @returns {boolean} True if online
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Get current base URL
   * @returns {string} Current base URL
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Set base URL (updates the existing api instance)
   * @param {string} newBaseUrl - New base URL
   */
  setBaseUrl(newBaseUrl) {
    this.api.defaults.baseURL = newBaseUrl;
    this.baseUrl = newBaseUrl;
    console.log(`🔧 API base URL updated to: ${newBaseUrl}`);
  }

  /**
   * Helper method to build conversation members dictionary
   * @param {Array} users - Array of user objects with id and name
   * @returns {Object} Dictionary mapping user ID to display name
   */
  buildMembersDictionary(users) {
    const members = {};
    users.forEach((user) => {
      const userId = Number(user.id || user.userId);
      const userName =
        user.name || user.fullName || user.userName || `User ${userId}`;
      members[userId] = userName;
    });
    return members;
  }

  /**
   * Helper method to validate conversation data before creation
   * @param {Object} conversationData - Conversation data to validate
   * @throws {Error} If validation fails
   */
  validateConversationData(conversationData) {
    if (
      !conversationData.members ||
      Object.keys(conversationData.members).length < 2
    ) {
      throw new Error("Conversation must have at least 2 members");
    }

    if (!conversationData.creatorId) {
      throw new Error("Creator ID is required");
    }

    if (!conversationData.conversationNameOne && !conversationData.nameOne) {
      throw new Error("First participant name is required");
    }

    if (!conversationData.conversationNameTwo && !conversationData.nameTwo) {
      throw new Error("Second participant name is required");
    }
  }

  /**
   * Helper method to validate message data before update
   * @param {Object} messageData - Message data to validate
   * @throws {Error} If validation fails
   */
  validateMessageData(messageData) {
    if (!messageData.messageId) {
      throw new Error("Message ID is required");
    }

    if (!messageData.conversationId) {
      throw new Error("Conversation ID is required");
    }

    if (!messageData.senderId) {
      throw new Error("Sender ID is required");
    }

    if (messageData.deliveryStatus !== undefined) {
      const validStatuses = [0, 1, 2, 3];
      if (!validStatuses.includes(Number(messageData.deliveryStatus))) {
        throw new Error(
          "Invalid delivery status. Must be 0-3 (Sending, Delivered, Read, Failed)"
        );
      }
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
