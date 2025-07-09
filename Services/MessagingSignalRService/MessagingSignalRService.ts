import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BaseMessagingSignalRService } from "./BaseMessagingSignalRService";
import {
  handleMessagingCallbacks,
  MESSAGING_EVENTS,
} from "./handleMessagingCallbacks";

// You'll need to set this to your messaging hub URL
const MESSAGING_HUB_URL =
  process.env.EXPO_PUBLIC_MESSAGING_HUB_URL ||
  "https://your-server.com/hub/messaging";

export class MessagingSignalRService extends BaseMessagingSignalRService {
  async StartConnection() {
    if (this.isConnected || this.isConnecting) {
      console.log("💬 MessagingSignalR: Already connected or connecting");
      return;
    }

    try {
      console.log("💬 MessagingSignalR: Starting connection");
      this.isConnecting = true;

      const accessToken = await AsyncStorage.getItem("accessToken");

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(MESSAGING_HUB_URL, {
          accessTokenFactory: () => Promise.resolve(accessToken ?? ""),
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) return 0;
            return Math.min(
              1000 * Math.pow(2, retryContext.previousRetryCount),
              30000
            );
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.handleConnectionLifecycle();
      handleMessagingCallbacks(this);

      await this.hubConnection.start();
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for stable connection

      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      console.log("💬 MessagingSignalR: Connected successfully");
      this.triggerCallback("onConnected");
    } catch (error) {
      console.error("💬 MessagingSignalR: Connection failed", error);
      this.triggerCallback("onConnectionFailed", error);
      this.isConnected = false;
      this.isConnecting = false;
      await this.handleRetryConnection();
    }
  }
}

// Singleton instance
export const messagingSignalRService = new MessagingSignalRService();

// Re-export MESSAGING_EVENTS for convenience
export { MESSAGING_EVENTS };
