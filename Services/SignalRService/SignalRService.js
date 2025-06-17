import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setupSignalRLifeCycleHandler } from "./setupSignalRLifeCycleHandler";
import * as signalR from "@microsoft/signalr";

class SignalRService {
  #connection = null;
  #isConnected = false;
  #isConnecting = false;
  #reconnectAttempts = 0;
  #maxReconnectAttempts = 5;
  #reconnectDelay = 5000; // 5 seconds
  #notificationCallbacks = new Map();
  #connectionCallbacks = new Map();

  constructor() {}

  // Public getters
  get connection() {
    return this.#connection;
  }
  get isConnected() {
    return this.#isConnected;
  }
  get isConnecting() {
    return this.#isConnecting;
  }
  get reconnectAttempts() {
    return this.#reconnectAttempts;
  }
  get maxReconnectAttempts() {
    return this.#maxReconnectAttempts;
  }
  get reconnectDelay() {
    return this.#reconnectDelay;
  }

  async startConnection() {
    if (this.#isConnected || this.#isConnecting) {
      console.log("SignalR: Already connected or connecting");
      return;
    }

    try {
      this.#isConnecting = true;

      // Get hub URL from environment variables
      const hubUrl = process.env.HUB_URL || process.env.EXPO_PUBLIC_HUB_URL;
      console.log("hubUrl", hubUrl);
      if (!hubUrl) {
        throw new Error("HUB_URL not found in environment variables");
      }

      const accessToken = await AsyncStorage.getItem("accessToken");

      // Build connection with authentication
      console.log("hubUrl", hubUrl);
      this.#connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => Promise.resolve(accessToken),
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
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

      await this.#connection.start();

      await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for connection to finish establishing
      setupSignalRLifeCycleHandler(this);

      this.#isConnected = true;
      this.#isConnecting = false;
      this.#reconnectAttempts = 0;

      console.log("SignalR: Connected successfully");
      this.triggerCallback("onConnected");
    } catch (error) {
      this.#isConnecting = false;
      console.error("SignalR: Connection failed", error);
      this.triggerCallback("onConnectionFailed", error);

      await this.handleReconnection();
    }
  }

  async addToGroup(groupName) {
    if (!this.#isConnected || !this.#connection) {
      console.warn("SignalR: Cannot join group - not connected");
      return false;
    }

    try {
      await this.#connection.invoke("AddToGroup", groupName);
      console.log(`SignalR: Successfully joined group: ${groupName}`);
      return true;
    } catch (error) {
      console.error(`SignalR: Failed to join group ${groupName}:`, error);
      return false;
    }
  }

  async removeFromGroup(groupName) {
    if (!this.#isConnected || !this.#connection) {
      console.warn("SignalR: Cannot leave group - not connected");
      return false;
    }

    try {
      await this.#connection.invoke("RemoveFromGroup", groupName);
      console.log(`SignalR: Successfully left group: ${groupName}`);
      return true;
    } catch (error) {
      console.error(`SignalR: Failed to leave group ${groupName}:`, error);
      return false;
    }
  }

  async handleReconnection() {
    if (this.#reconnectAttempts >= this.#maxReconnectAttempts) {
      console.log("SignalR: Max reconnection attempts reached");
      this.triggerCallback("onMaxReconnectAttemptsReached");
      return;
    }

    this.#reconnectAttempts++;
    console.log(
      `SignalR: Reconnection attempt ${this.#reconnectAttempts}/${
        this.#maxReconnectAttempts
      }`
    );

    setTimeout(async () => {
      if (!this.#isConnected) {
        await this.startConnection();
      }
    }, this.#reconnectDelay);
  }

  async stopConnection() {
    if (this.#connection) {
      try {
        await this.#connection.stop();
        this.#isConnected = false;
        console.log("SignalR: Connection stopped");
      } catch (error) {
        console.error("SignalR: Error stopping connection", error);
      }
    }
  }

  onEvent(eventName, callback) {
    if (!this.#connectionCallbacks.has(eventName)) {
      this.#connectionCallbacks.set(eventName, []);
    }
    this.#connectionCallbacks.get(eventName).push(callback);
  }

  offEvent(eventName, callback) {
    if (this.#connectionCallbacks.has(eventName)) {
      const callbacks = this.#connectionCallbacks.get(eventName);
      if (callbacks) {
        this.#connectionCallbacks.set(
          eventName,
          callbacks.filter((c) => c !== callback)
        );
      }
    }
  }

  triggerCallback(eventName, data = null) {
    if (this.#connectionCallbacks.has(eventName)) {
      this.#connectionCallbacks.get(eventName).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SignalR: Error in ${eventName} callback:`, error);
        }
      });
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.#isConnected,
      isConnecting: this.#isConnecting,
      reconnectAttempts: this.#reconnectAttempts,
      connectionId: this.#connection?.connectionId || null,
    };
  }
}

const signalRService = new SignalRService();
export default signalRService;
