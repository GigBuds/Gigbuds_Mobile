import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setupSignalRLifeCycleHandler } from "./setupSignalRLifeCycleHandler";
import { setupNotificationHandlers } from "./setupNotificationHandlers";
/**
 * SignalRService class for managing SignalR connection and events.
 */
class SignalRService {
  constructor() {
    // Connection object for SignalR when connected to the server
    this.connection = null;

    // Connection status
    this.isConnected = false;
    this.isConnecting = false;

    // Reconnect attempts
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds

    // Notification callbacks
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

      // Set up connection lifecycle event handlers
      setupSignalRLifeCycleHandler(this);

      // Set up notification handlers
      setupNotificationHandlers(
        this.connection,
        this.handleNotification.bind(this)
      );

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
      additionalPayload: notificationData.additionalPayload || null,  
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
