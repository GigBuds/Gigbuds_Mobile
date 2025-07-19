import {
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "./ApiService.js";

/**
 * SIGNALR SERVICE FOR REAL-TIME MESSAGING
 *
 * This service handles all real-time WebSocket communication for the messaging system:
 * - Real-time message delivery (send/receive instantly)
 * - Typing indicators ("User is typing...")
 * - Online presence tracking (who's online/offline)
 * - Connection lifecycle management (auto-reconnect, authentication)
 * - Push notification integration
 * - Message status updates (delivered, read)
 *
 * Hub Methods (what the server can call on client):
 * - ReceiveMessage(message) - New message received
 * - UserStartedTyping(userId, conversationId) - Someone started typing
 * - UserStoppedTyping(userId, conversationId) - Someone stopped typing
 * - UserOnlineStatusChanged(userId, isOnline) - User went online/offline
 * - MessageStatusUpdated(messageId, status) - Message delivery/read status
 * - ConversationUpdated(conversationId, metadata) - Conversation metadata changed
 * - NotificationReceived(notification) - Push notification data
 *
 * Client Methods (what we can call on server):
 * - SendMessage(conversationId, message) - Send a message
 * - JoinConversation(conversationId) - Join conversation room
 * - LeaveConversation(conversationId) - Leave conversation room
 * - StartTyping(conversationId) - Start typing indicator
 * - StopTyping(conversationId) - Stop typing indicator
 * - UpdateOnlineStatus(isOnline) - Update user's online status
 * - MarkMessageAsRead(messageId) - Mark message as read
 */

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.baseUrl = null;
    this.currentUserId = null;
    this.activeConversations = new Set(); // Track joined conversations
    this.typingTimeouts = new Map(); // Track typing timeouts
    this.connectionAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds

    // Event handlers - can be set by consumers
    this.onMessageReceived = null;
    this.onTypingChanged = null;
    this.onUserOnlineStatusChanged = null;
    this.onMessageStatusUpdated = null;
    this.onConversationUpdated = null;
    this.onNotificationReceived = null;
    this.onConnectionStateChanged = null;
    this.onError = null;

    // Additional handlers for direct property assignment
    this.onUserOnline = null;
    this.onUserDisconnected = null;
    this.onMessageEdited = null;
    this.onMessageDeleted = null;
  }

  // ==================== CONNECTION MANAGEMENT ====================

  /**
   * Initialize and start the SignalR connection
   * @param {string} hubUrl - SignalR hub URL (optional, uses API base + /messagingHub)
   * @returns {Promise<boolean>} True if connection successful
   */
  async connect(hubUrl = null) {
    if (this.isConnecting) {
      console.log("🔄 SignalR connection already in progress");
      return false;
    }

    if (
      this.connection &&
      this.connection.state === HubConnectionState.Connected
    ) {
      console.log("✅ SignalR already connected");
      return true;
    }

    try {
      this.isConnecting = true;
      console.log("🚀 Starting SignalR connection...");

      // Get authentication token
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Get current user ID
      this.currentUserId = await this.getCurrentUserId();
      if (!this.currentUserId) {
        throw new Error("Could not determine current user ID");
      }

      // Configure hub URL - use environment variable
      this.baseUrl =
        hubUrl ||
        process.env.EXPO_PUBLIC_MESSAGING_HUB_URL ||
        `${apiService.getBaseUrl().replace("/api/v1/", "")}/hub/messaging`;
      console.log(`🌐 Connecting to SignalR hub: ${this.baseUrl}`);

      // Build connection with authentication
      this.connection = new HubConnectionBuilder()
        .withUrl(this.baseUrl, {
          accessTokenFactory: () => token,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 3s, 6s, 12s, 24s, 30s max
            const delay = Math.min(
              30000,
              3000 * Math.pow(2, retryContext.previousRetryCount)
            );
            console.log(
              `🔄 SignalR reconnect attempt ${
                retryContext.previousRetryCount + 1
              } in ${delay}ms`
            );
            return delay;
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupConnectionHandlers();
      this.setupMessageHandlers();

      // Start connection
      await this.connection.start();
      this.isAuthenticated = true;
      this.connectionAttempts = 0;

      console.log(
        `✅ SignalR connected successfully as user ${this.currentUserId}`
      );
      this.notifyConnectionStateChanged(HubConnectionState.Connected);

      return true;
    } catch (error) {
      console.error("❌ Failed to connect to SignalR:", error.message);
      this.notifyError("Connection failed", error);
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from SignalR hub
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.connection) {
        console.log("🔌 Disconnecting from SignalR hub...");

        // Leave all active conversations
        for (const conversationId of this.activeConversations) {
          await this.leaveConversation(conversationId);
        }

        // Stop connection
        await this.connection.stop();
        this.connection = null;
        this.isAuthenticated = false;
        this.activeConversations.clear();
        this.typingTimeouts.clear();

        console.log("✅ SignalR disconnected successfully");
        this.notifyConnectionStateChanged(HubConnectionState.Disconnected);
      }
    } catch (error) {
      console.error("❌ Error disconnecting from SignalR:", error.message);
      this.notifyError("Disconnect failed", error);
    }
  }

  /**
   * Get current connection state
   * @returns {string} Connection state
   */
  getConnectionState() {
    return this.connection
      ? this.connection.state
      : HubConnectionState.Disconnected;
  }

  /**
   * Check if SignalR is connected and ready
   * @returns {boolean} True if connected
   */
  isConnected() {
    return (
      this.connection &&
      this.connection.state === HubConnectionState.Connected &&
      this.isAuthenticated
    );
  }

  // ==================== EVENT HANDLER SETUP ====================

  /**
   * Setup connection lifecycle event handlers
   */
  setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.log("🔌 SignalR connection closed");
      if (error) {
        console.error("❌ Connection closed with error:", error.message);
        this.notifyError("Connection lost", error);
      }
      this.isAuthenticated = false;
      this.notifyConnectionStateChanged(HubConnectionState.Disconnected);
    });

    this.connection.onreconnecting(() => {
      console.log("🔄 SignalR reconnecting...");
      this.isAuthenticated = false;
      this.notifyConnectionStateChanged(HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected((connectionId) => {
      console.log(`✅ SignalR reconnected with ID: ${connectionId}`);
      this.isAuthenticated = true;
      this.notifyConnectionStateChanged(HubConnectionState.Connected);

      // Rejoin all active conversations
      this.rejoinActiveConversations();
    });
  }

  /**
   * Setup message and event handlers from server according to documentation
   */
  setupMessageHandlers() {
    if (!this.connection) return;

    // Message received - ReceiveMessageAsync
    this.connection.on("ReceiveMessageAsync", (conversation, chatHistory) => {
      console.log(
        "MessagingSignalR: Received message",
        conversation,
        chatHistory
      );

      // Type conversions for React Native
      conversation.id = Number(conversation.id);
      conversation.timestamp = conversation.timestamp
        ? new Date(conversation.timestamp)
        : null;
      chatHistory.conversationId = Number(chatHistory.conversationId);
      chatHistory.senderId = Number(chatHistory.senderId);
      chatHistory.timestamp = chatHistory.timestamp
        ? new Date(chatHistory.timestamp)
        : null;

      this.triggerCallback("onMessageReceived", { conversation, chatHistory });
    });

    // Typing indicator - ReceiveTypingIndicatorAsync
    this.connection.on(
      "ReceiveTypingIndicatorAsync",
      (isTyping, typerName, conversationId) => {
        console.log(
          "MessagingSignalR: Received typing indicator",
          isTyping,
          typerName,
          conversationId
        );
        // Call the typing changed handler with proper format
        if (this.onTypingChanged) {
          this.onTypingChanged({
            isTyping,
            typerName,
            conversationId: Number(conversationId),
            timestamp: new Date(),
          });
        }
      }
    );

    // Message status updates - ReceiveMessageStatusAsync
    this.connection.on("ReceiveMessageStatusAsync", (data) => {
      console.log("MessagingSignalR: Received message status", data);
      this.triggerCallback("onMessageStatusReceived", data);
    });

    // User online status - UserOnlineAsync
    this.connection.on("UserOnlineAsync", (userId) => {
      console.log("MessagingSignalR: User online", userId);
      if (this.onUserOnline) {
        this.onUserOnline(Number(userId));
      }
    });

    // User disconnected - UserDisconnectedAsync
    this.connection.on("UserDisconnectedAsync", (onlineUser) => {
      console.log("MessagingSignalR: User disconnected", onlineUser);
      if (this.onUserDisconnected) {
        this.onUserDisconnected(onlineUser);
      }
    });

    // Message edited - MessageEditedAsync
    this.connection.on(
      "MessageEditedAsync",
      (messageId, conversationId, newContent) => {
        console.log("MessagingSignalR: Message edited", {
          messageId,
          conversationId,
          newContent,
        });
        if (this.onMessageEdited) {
          this.onMessageEdited({
            messageId,
            conversationId: Number(conversationId),
            newContent,
          });
        }
      }
    );

    // Message deleted - MessageDeletedAsync
    this.connection.on("MessageDeletedAsync", (messageId, conversationId) => {
      console.log("MessagingSignalR: Message deleted", {
        messageId,
        conversationId,
      });
      if (this.onMessageDeleted) {
        this.onMessageDeleted({
          messageId,
          conversationId: Number(conversationId),
        });
      }
    });
  }

  /**
   * Trigger a callback event
   * @param {string} eventName - Name of the event
   * @param {*} data - Data to pass to callback
   */
  triggerCallback(eventName, data = null) {
    if (this[eventName] && typeof this[eventName] === "function") {
      try {
        this[eventName](data);
      } catch (error) {
        console.error(`SignalR: Error in ${eventName} callback:`, error);
      }
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Send a message to a conversation
   * @param {number} conversationId - ID of the conversation
   * @param {string} messageContent - Message text content
   * @param {Object} metadata - Additional message metadata (optional)
   * @returns {Promise<Object>} New message object if sent successfully, null otherwise
   */
  async sendMessage(conversationId, messageContent, metadata = {}) {
    if (!this.isConnected()) {
      console.error("❌ Cannot send message: SignalR not connected");
      return null;
    }

    try {
      console.log(`📤 Sending message to conversation ${conversationId}`);

      // Match ChatHistory interface structure (omitting messageId and timestamp)
      const messageData = {
        conversationId: Number(conversationId),
        senderId: Number(this.currentUserId),
        senderName: metadata.senderName || `User ${this.currentUserId}`, // Required field
        senderAvatar: metadata.senderAvatar || "", // Required field
        content: messageContent.trim(),
        readByNames: [],
        deliveryStatus: "Sending",
        isDeleted: false,
        // messageId and timestamp will be set by server
      };

      // Send single message object (matching TypeScript example)
      const newMessage = await this.connection.invoke(
        "SendMessage",
        messageData
      );

      newMessage.timestamp = new Date(newMessage.timestamp);
      console.log(`✅ Message sent to conversation ${conversationId}:`, newMessage);
      return newMessage;
    } catch (error) {
      console.error(
        `❌ Failed to send message to conversation ${conversationId}:`,
        error.message
      );
      this.notifyError("Send message failed", error);
      return false;
    }
  }

  /**
   * Check into a conversation (notify server user is viewing this conversation)
   * @param {number} conversationId - ID of the conversation to check into
   * @returns {Promise<boolean>} True if checked in successfully
   */
  async joinConversation(conversationId) {
    if (!this.isConnected()) {
      console.error("❌ Cannot check into conversation: SignalR not connected");
      return false;
    }

    try {
      console.log(`📱 Checking into conversation ${conversationId}`);

      await this.connection.invoke(
        "OnConversationCheckin",
        Number(conversationId)
      );
      this.activeConversations.add(conversationId);

      console.log(`✅ Checked into conversation ${conversationId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to check into conversation ${conversationId}:`,
        error.message
      );
      this.notifyError("Conversation checkin failed", error);
      return false;
    }
  }

  /**
   * Check out of a conversation (notify server user left this conversation)
   * @param {number} conversationId - ID of the conversation to check out of
   * @returns {Promise<boolean>} True if checked out successfully
   */
  async leaveConversation(conversationId) {
    if (!this.isConnected()) {
      console.warn(
        "⚠️ Cannot check out of conversation: SignalR not connected"
      );
      return false;
    }

    try {
      console.log(`📱 Checking out of conversation ${conversationId}`);

      await this.connection.invoke(
        "OnConversationCheckout",
        Number(conversationId)
      );
      this.activeConversations.delete(conversationId);

      // Clear any typing timeouts for this conversation
      this.clearTypingTimeout(conversationId);

      console.log(`✅ Checked out of conversation ${conversationId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to check out of conversation ${conversationId}:`,
        error.message
      );
      this.notifyError("Conversation checkout failed", error);
      return false;
    }
  }

  // ==================== TYPING INDICATORS ====================

  /**
   * Send typing indicator (both start and stop)
   * @param {number} conversationId - ID of the conversation
   * @param {boolean} isTyping - True for start typing, false for stop typing
   * @param {string} userName - Name of the user typing
   * @returns {Promise<boolean>} True if sent successfully
   */
  async sendTypingIndicator(conversationId, isTyping, userName) {
    if (!this.isConnected()) {
      return false;
    }

    try {
      console.log(
        `🔄 Sending typing indicator: ${userName} ${
          isTyping ? "started" : "stopped"
        } typing in conversation ${conversationId}`
      );

      await this.connection.invoke(
        "SendTypingIndicator",
        Number(conversationId),
        isTyping,
        userName
      );

      if (isTyping) {
        // Auto-stop typing after 3 seconds if no new typing events
        this.setTypingTimeout(conversationId);
      }

      return true;
    } catch (error) {
      console.error(`❌ Failed to send typing indicator:`, error.message);
      return false;
    }
  }

  /**
   * Send typing started signal
   * @param {number} conversationId - ID of the conversation
   * @returns {Promise<boolean>} True if sent successfully
   */
  async startTyping(conversationId) {
    const userInfo = await this.getCurrentUserInfo();
    return this.sendTypingIndicator(conversationId, true, userInfo.userName);
  }

  /**
   * Send typing stopped signal
   * @param {number} conversationId - ID of the conversation
   * @returns {Promise<boolean>} True if sent successfully
   */
  async stopTyping(conversationId) {
    const userInfo = await this.getCurrentUserInfo();
    return this.sendTypingIndicator(conversationId, false, userInfo.userName);
  }

  // ==================== MESSAGE EDITING & DELETION ====================

  /**
   * Edit an existing message
   * @param {string} messageId - ID of the message to edit
   * @param {number} conversationId - ID of the conversation
   * @param {string} newContent - New message content
   * @returns {Promise<boolean>} True if edited successfully
   */
  async editMessage(messageId, conversationId, newContent) {
    if (!this.isConnected()) {
      console.error("❌ Cannot edit message: SignalR not connected");
      return false;
    }

    try {
      console.log(
        `✏️ Editing message ${messageId} in conversation ${conversationId}`
      );

      await this.connection.invoke(
        "EditMessage",
        messageId,
        Number(conversationId),
        newContent
      );
      console.log(`✅ Message ${messageId} edited successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to edit message ${messageId}:`, error.message);
      this.notifyError("Edit message failed", error);
      return false;
    }
  }

  /**
   * Delete a message
   * @param {string} messageId - ID of the message to delete
   * @param {number} conversationId - ID of the conversation
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteMessage(messageId, conversationId) {
    if (!this.isConnected()) {
      console.error("❌ Cannot delete message: SignalR not connected");
      return false;
    }

    try {
      console.log(
        `🗑️ Deleting message ${messageId} in conversation ${conversationId}`
      );

      await this.connection.invoke(
        "DeleteMessage",
        messageId,
        Number(conversationId)
      );
      console.log(`✅ Message ${messageId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete message ${messageId}:`, error.message);
      this.notifyError("Delete message failed", error);
      return false;
    }
  }

  /**
   * Get list of currently online users
   * @returns {Promise<Array>} Array of online users
   */
  async getOnlineUsers() {
    if (!this.isConnected()) {
      console.error("❌ Cannot get online users: SignalR not connected");
      return [];
    }

    try {
      console.log("👥 Fetching online users list");

      const onlineUsers = await this.connection.invoke("GetOnlineUsers");
      console.log(`✅ Found ${onlineUsers.length} online users:`, onlineUsers);
      return onlineUsers;
    } catch (error) {
      console.error("❌ Failed to get online users:", error.message);
      return [];
    }
  }

  /**
   * Set a timeout to auto-stop typing
   * @param {number} conversationId - ID of the conversation
   */
  setTypingTimeout(conversationId) {
    this.clearTypingTimeout(conversationId);

    const timeout = setTimeout(() => {
      // Use non-blocking call to avoid UI freezing
      this.stopTyping(conversationId).catch((error) => {
        console.warn("⚠️ Auto-stop typing failed:", error.message);
      });
    }, 3000); // 3 seconds

    this.typingTimeouts.set(conversationId, timeout);
  }

  /**
   * Clear typing timeout for a conversation
   * @param {number} conversationId - ID of the conversation
   */
  clearTypingTimeout(conversationId) {
    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }
  }

  // ==================== ONLINE PRESENCE ====================

  /**
   * Update user's online status
   * @param {boolean} isOnline - Whether user is online
   * @returns {Promise<boolean>} True if updated successfully
   */
  async updateOnlineStatus(isOnline) {
    if (!this.isConnected()) {
      return false;
    }

    try {
      console.log(
        `🟢 Updating online status to: ${isOnline ? "online" : "offline"}`
      );

      await this.connection.invoke("UpdateOnlineStatus", Boolean(isOnline));
      console.log(
        `✅ Online status updated to: ${isOnline ? "online" : "offline"}`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to update online status:", error.message);
      this.notifyError("Update online status failed", error);
      return false;
    }
  }

  // ==================== MESSAGE STATUS ====================

  /**
   * Mark a message as read
   * @param {number} messageId - ID of the message
   * @returns {Promise<boolean>} True if marked successfully
   */
  async markMessageAsRead(messageId) {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.connection.invoke("MarkMessageAsRead", Number(messageId));
      console.log(`✅ Marked message ${messageId} as read`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to mark message ${messageId} as read:`,
        error.message
      );
      return false;
    }
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Handle received message event
   * @param {Object} message - Received message data
   */
  handleMessageReceived(message) {
    // Normalize message data
    const normalizedMessage = {
      ...message,
      conversationId: Number(message.conversationId),
      senderId: Number(message.senderId),
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      messageId: Number(message.messageId),
      isFromCurrentUser:
        Number(message.senderId) === Number(this.currentUserId),
    };

    if (this.onMessageReceived) {
      this.onMessageReceived(normalizedMessage);
    }
  }

  /**
   * Handle typing status changed event
   * @param {number} userId - ID of the user typing
   * @param {number} conversationId - ID of the conversation
   * @param {boolean} isTyping - Whether user is typing
   */
  handleTypingChanged(userId, conversationId, isTyping) {
    // Don't notify about own typing
    if (Number(userId) === Number(this.currentUserId)) {
      return;
    }

    if (this.onTypingChanged) {
      this.onTypingChanged({
        userId: Number(userId),
        conversationId: Number(conversationId),
        isTyping: Boolean(isTyping),
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle user online status changed event
   * @param {number} userId - ID of the user
   * @param {boolean} isOnline - Whether user is online
   */
  handleUserOnlineStatusChanged(userId, isOnline) {
    if (this.onUserOnlineStatusChanged) {
      this.onUserOnlineStatusChanged({
        userId: Number(userId),
        isOnline: Boolean(isOnline),
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle message status updated event
   * @param {number} messageId - ID of the message
   * @param {string} status - New status (delivered, read, etc.)
   */
  handleMessageStatusUpdated(messageId, status) {
    if (this.onMessageStatusUpdated) {
      this.onMessageStatusUpdated({
        messageId: Number(messageId),
        status: status,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle conversation updated event
   * @param {number} conversationId - ID of the conversation
   * @param {Object} metadata - Updated conversation metadata
   */
  handleConversationUpdated(conversationId, metadata) {
    if (this.onConversationUpdated) {
      this.onConversationUpdated({
        conversationId: Number(conversationId),
        metadata: metadata,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle notification received event
   * @param {Object} notification - Notification data
   */
  handleNotificationReceived(notification) {
    if (this.onNotificationReceived) {
      this.onNotificationReceived({
        ...notification,
        timestamp: new Date(),
      });
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get current user ID from storage or API
   * @returns {Promise<number>} User ID
   */
  async getCurrentUserId() {
    try {
      // Try to get from AsyncStorage first
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        return Number(storedUserId);
      }

      // Fallback to API call
      const profile = await apiService.getUserProfile();
      if (profile && profile.id) {
        await AsyncStorage.setItem("userId", String(profile.id));
        return Number(profile.id);
      }

      throw new Error("Could not determine user ID");
    } catch (error) {
      console.error("❌ Failed to get current user ID:", error.message);
      return null;
    }
  }

  /**
   * Get current user information from AsyncStorage
   * @returns {Promise<{userId: number, userName: string}>} User info object
   */
  async getCurrentUserInfo() {
    try {
      // Get both userId and userName from AsyncStorage
      const [storedUserId, storedUserName] = await Promise.all([
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("userName"),
      ]);

      if (storedUserId && storedUserName) {
        return {
          userId: Number(storedUserId),
          userName: storedUserName,
        };
      }

      // Fallback to getCurrentUserId if userName is missing
      const userId = await this.getCurrentUserId();
      if (userId) {
        return {
          userId: userId,
          userName: `User ${userId}`, // Fallback name if userName not stored
        };
      }

      throw new Error("Could not determine user information");
    } catch (error) {
      console.error("❌ Failed to get current user info:", error.message);
      return {
        userId: null,
        userName: "Unknown User",
      };
    }
  }

  /**
   * Rejoin all active conversations after reconnection
   */
  async rejoinActiveConversations() {
    console.log(
      `🔄 Rejoining ${this.activeConversations.size} active conversations`
    );

    for (const conversationId of this.activeConversations) {
      try {
        await this.connection.invoke(
          "JoinConversation",
          Number(conversationId)
        );
        console.log(`✅ Rejoined conversation ${conversationId}`);
      } catch (error) {
        console.error(
          `❌ Failed to rejoin conversation ${conversationId}:`,
          error.message
        );
      }
    }
  }

  /**
   * Notify connection state changed
   * @param {string} state - New connection state
   */
  notifyConnectionStateChanged(state) {
    if (this.onConnectionStateChanged) {
      this.onConnectionStateChanged({
        state: state,
        isConnected: state === HubConnectionState.Connected,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Notify error occurred
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  notifyError(message, error) {
    if (this.onError) {
      this.onError({
        message: message,
        error: error,
        timestamp: new Date(),
      });
    }
  }

  // ==================== EVENT LISTENER SETTERS ====================

  /**
   * Set message received handler
   * @param {Function} handler - (message) => void
   */
  setOnMessageReceived(handler) {
    this.onMessageReceived = handler;
  }

  /**
   * Set typing changed handler
   * @param {Function} handler - ({userId, conversationId, isTyping, timestamp}) => void
   */
  setOnTypingChanged(handler) {
    this.onTypingChanged = handler;
  }

  /**
   * Set user online status changed handler
   * @param {Function} handler - ({userId, isOnline, timestamp}) => void
   */
  setOnUserOnlineStatusChanged(handler) {
    this.onUserOnlineStatusChanged = handler;
  }

  /**
   * Set message status updated handler
   * @param {Function} handler - ({messageId, status, timestamp}) => void
   */
  setOnMessageStatusUpdated(handler) {
    this.onMessageStatusUpdated = handler;
  }

  /**
   * Set conversation updated handler
   * @param {Function} handler - ({conversationId, metadata, timestamp}) => void
   */
  setOnConversationUpdated(handler) {
    this.onConversationUpdated = handler;
  }

  /**
   * Set notification received handler
   * @param {Function} handler - (notification) => void
   */
  setOnNotificationReceived(handler) {
    this.onNotificationReceived = handler;
  }

  /**
   * Set connection state changed handler
   * @param {Function} handler - ({state, isConnected, timestamp}) => void
   */
  setOnConnectionStateChanged(handler) {
    this.onConnectionStateChanged = handler;
  }

  /**
   * Set error handler
   * @param {Function} handler - ({message, error, timestamp}) => void
   */
  setOnError(handler) {
    this.onError = handler;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
