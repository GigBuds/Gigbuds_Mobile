import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.notificationCallbacks = new Map();
    this.connectionCallbacks = new Map();
  }

  /**
   * Initialize and start SignalR connection
   */
  async startConnection() {
    if (this.isConnected || this.isConnecting) {
      console.log("SignalR: Already connected or connecting");
      return;
    }

    try {
      this.isConnecting = true;

      // Get hub URL from environment variables
      const hubUrl = process.env.HUB_URL || process.env.EXPO_PUBLIC_HUB_URL;
      console.log("hubUrl", hubUrl);
      if (!hubUrl) {
        throw new Error("HUB_URL not found in environment variables");
      }

      const accessToken = await AsyncStorage.getItem("accessToken");

      // Build connection with authentication
      console.log("hubUrl", hubUrl);
      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => accessToken,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) {
              return 0;
            }
            return Math.min(
              1000 * Math.pow(2, retryContext.previousRetryCount),
              30000
            );
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up connection event handlers
      this.setupConnectionHandlers();

      // Set up notification handlers
      this.setupNotificationHandlers();

      // Start the connection
      await this.connection.start();

      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      console.log("SignalR: Connected successfully");
      this.triggerCallback("onConnected");
    } catch (error) {
      this.isConnecting = false;
      console.error("SignalR: Connection failed", error);
      this.triggerCallback("onConnectionFailed", error);

      // Attempt reconnection
      await this.handleReconnection();
    }
  }

  /**
   * Set up connection lifecycle handlers
   */
  setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onclose(async (error) => {
      this.isConnected = false;
      console.log("SignalR: Connection closed", error);
      this.triggerCallback("onDisconnected", error);

      // Attempt reconnection if not manually closed
      if (error) {
        await this.handleReconnection();
      }
    });

    this.connection.onreconnecting((error) => {
      console.log("SignalR: Reconnecting...", error);
      this.triggerCallback("onReconnecting", error);
    });

    this.connection.onreconnected((connectionId) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("SignalR: Reconnected", connectionId);
      this.triggerCallback("onReconnected", connectionId);
    });
  }

  /**
   * Set up all notification handlers from the server
   */
  setupNotificationHandlers() {
    if (!this.connection) return;

    // Job seeker notifications
    this.connection.on("NotifyNewPostFromFollowedEmployer", (data) => {
      console.log("SignalR: New post from followed employer", data);
      this.handleNotification("job", {
        title: "Có việc làm mới từ nhà tuyển dụng theo dõi",
        message:
          data?.message || "Nhà tuyển dụng bạn theo dõi vừa đăng công việc mới",
        data: data,
        type: "job",
      });
    });

    this.connection.on("NotifyJobFeedbackReceived", (data) => {
      console.log("SignalR: Job feedback received", data);
      this.handleNotification("feedback", {
        title: "Nhận được đánh giá công việc",
        message:
          data?.message || "Bạn vừa nhận được đánh giá từ nhà tuyển dụng",
        data: data,
        type: "feedback",
      });
    });

    this.connection.on("NotifyJobFeedbackSent", (data) => {
      console.log("SignalR: Job feedback sent", data);
      this.handleNotification("feedback", {
        title: "Đánh giá đã được gửi",
        message: data?.message || "Đánh giá của bạn đã được gửi thành công",
        data: data,
        type: "feedback",
      });
    });

    this.connection.on("NotifyJobApplicationAccepted", (data) => {
      console.log("SignalR: Job application accepted", data);
      this.handleNotification("application", {
        title: "Đơn ứng tuyển được chấp nhận",
        message:
          data?.message || "Chúc mừng! Đơn ứng tuyển của bạn đã được chấp nhận",
        data: data,
        type: "application",
      });
    });

    this.connection.on("NotifyJobApplicationRejected", (data) => {
      console.log("SignalR: Job application rejected", data);
      this.handleNotification("application", {
        title: "Đơn ứng tuyển bị từ chối",
        message:
          data?.message || "Đơn ứng tuyển của bạn không được chấp nhận lần này",
        data: data,
        type: "application",
      });
    });

    this.connection.on("NotifyJobApplicationRemovedFromApproved", (data) => {
      console.log("SignalR: Job application removed from approved", data);
      this.handleNotification("application", {
        title: "Đơn ứng tuyển bị hủy phê duyệt",
        message: data?.message || "Đơn ứng tuyển của bạn đã bị hủy phê duyệt",
        data: data,
        type: "application",
      });
    });

    this.connection.on("NotifyJobCompleted", (data) => {
      console.log("SignalR: Job completed", data);
      this.handleNotification("schedule", {
        title: "Công việc hoàn thành",
        message:
          data?.message || "Công việc của bạn đã được đánh dấu hoàn thành",
        data: data,
        type: "schedule",
      });
    });

    this.connection.on(
      "NotifyNewJobPostMatching",
      (payload, additionalPayload) => {
        console.log(
          "SignalR: New job post matching",
          payload,
          additionalPayload
        );
        this.handleNotification("job", {
          title: "Có việc làm phù hợp",
          message: payload || "Có công việc mới phù hợp với hồ sơ của bạn",
          data: payload,
          type: "job",
        });
      }
    );

    this.connection.on("NotifyProfileViewedByEmployer", (data) => {
      console.log("SignalR: Profile viewed by employer", data);
      this.handleNotification("profile", {
        title: "Hồ sơ được xem",
        message: data?.message || "Nhà tuyển dụng đã xem hồ sơ của bạn",
        data: data,
        type: "profile",
      });
    });
  }

  /**
   * Handle incoming notifications and trigger callbacks
   */
  handleNotification(type, notificationData) {
    const notification = {
      id: Date.now().toString(),
      type: notificationData.type || type,
      title: notificationData.title,
      message: notificationData.message,
      timestamp: new Date(),
      isRead: false,
      data: notificationData.data,
    };

    // Trigger notification callback
    this.triggerCallback("onNotificationReceived", notification);
  }

  /**
   * Join a SignalR group
   */
  async addToGroup(groupName) {
    if (!this.isConnected || !this.connection) {
      console.warn("SignalR: Cannot join group - not connected");
      return false;
    }

    try {
      await this.connection.invoke("AddToGroup", groupName);
      console.log(`SignalR: Successfully joined group: ${groupName}`);
      return true;
    } catch (error) {
      console.error(`SignalR: Failed to join group ${groupName}:`, error);
      return false;
    }
  }

  /**
   * Leave a SignalR group
   */
  async removeFromGroup(groupName) {
    if (!this.isConnected || !this.connection) {
      console.warn("SignalR: Cannot leave group - not connected");
      return false;
    }

    try {
      await this.connection.invoke("RemoveFromGroup", groupName);
      console.log(`SignalR: Successfully left group: ${groupName}`);
      return true;
    } catch (error) {
      console.error(`SignalR: Failed to leave group ${groupName}:`, error);
      return false;
    }
  }

  /**
   * Handle reconnection attempts
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("SignalR: Max reconnection attempts reached");
      this.triggerCallback("onMaxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `SignalR: Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(async () => {
      if (!this.isConnected) {
        await this.startConnection();
      }
    }, this.reconnectDelay);
  }

  /**
   * Stop the SignalR connection
   */
  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log("SignalR: Connection stopped");
      } catch (error) {
        console.error("SignalR: Error stopping connection", error);
      }
    }
  }

  /**
   * Register callback for various events
   */
  onEvent(eventName, callback) {
    if (!this.connectionCallbacks.has(eventName)) {
      this.connectionCallbacks.set(eventName, []);
    }
    this.connectionCallbacks.get(eventName).push(callback);
  }

  /**
   * Remove event callback
   */
  offEvent(eventName, callback) {
    if (this.connectionCallbacks.has(eventName)) {
      const callbacks = this.connectionCallbacks.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Trigger registered callbacks
   */
  triggerCallback(eventName, data = null) {
    if (this.connectionCallbacks.has(eventName)) {
      this.connectionCallbacks.get(eventName).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SignalR: Error in ${eventName} callback:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      connectionId: this.connection?.connectionId || null,
    };
  }

  /**
   * Update authentication token
   */
  async updateAuthToken() {
    if (this.isConnected) {
      // Reconnect with new token
      await this.stopConnection();
      await this.startConnection();
    }
  }
}

// Export singleton instance
const signalRService = new SignalRService();
export default signalRService;
