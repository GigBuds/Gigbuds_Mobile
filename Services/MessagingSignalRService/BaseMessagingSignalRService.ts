import * as signalR from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";

export abstract class BaseMessagingSignalRService {
  protected hubConnection: signalR.HubConnection | null = null;
  protected isConnected: boolean = false;
  protected isConnecting: boolean = false;
  protected reconnectAttempts: number = 0;
  protected readonly maxReconnectAttempts: number = 5;
  protected readonly reconnectDelay: number = 5000;
  protected readonly callbacks: Map<string, ((data: unknown) => void)[]> =
    new Map();

  abstract StartConnection(): Promise<void>;

  protected async handleConnectionLifecycle() {
    if (!this.hubConnection) return;

    this.hubConnection.onclose(async (error: Error | undefined) => {
      this.isConnected = false;
      console.log("💬 MessagingSignalR: Connection closed", error);
      this.triggerCallback("onDisconnected", error);

      if (error) {
        await this.handleRetryConnection();
      }
    });

    this.hubConnection.onreconnecting((error: Error | undefined) => {
      console.log("💬 MessagingSignalR: Reconnecting...", error);
      this.triggerCallback("onReconnecting", error);
    });

    this.hubConnection.onreconnected((connectionId: string | undefined) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("💬 MessagingSignalR: Reconnected", connectionId);
      this.triggerCallback("onReconnected", connectionId);
    });
  }

  async handleRetryConnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("💬 MessagingSignalR: Max reconnect attempts reached");
      this.triggerCallback("onMaxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `💬 MessagingSignalR: Reconnecting... (attempt ${this.reconnectAttempts})`
    );

    setTimeout(async () => {
      await this.StartConnection();
    }, this.reconnectDelay);
  }

  async StopConnection() {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isConnected = false;
      console.log("💬 MessagingSignalR: Connection stopped");
    }
  }

  // Callback management
  registerCallback(eventName: string, callback: (data: unknown) => void) {
    if (!this.callbacks.has(eventName)) {
      this.callbacks.set(eventName, []);
    }
    this.callbacks.get(eventName)!.push(callback);
  }

  removeCallback(eventName: string, callback: (data: unknown) => void) {
    if (this.callbacks.has(eventName)) {
      const callbacks = this.callbacks.get(eventName);
      if (callbacks) {
        this.callbacks.set(
          eventName,
          callbacks.filter((cb) => cb !== callback)
        );
      }
    }
  }

  triggerCallback(eventName: string, data: unknown = null) {
    if (this.callbacks.has(eventName)) {
      const callbacks = this.callbacks.get(eventName);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error(
              `💬 MessagingSignalR: Error in ${eventName} callback:`,
              error
            );
          }
        });
      }
    }
  }

  // Hub method invocation
  async InvokeHubMethod(
    methodName: string,
    ...args: unknown[]
  ): Promise<unknown> {
    if (
      !this.hubConnection ||
      this.hubConnection.state !== signalR.HubConnectionState.Connected
    ) {
      throw new Error("Hub connection is not connected");
    }
    return this.hubConnection.invoke(methodName, ...args);
  }

  async SendHubMethod(methodName: string, ...args: unknown[]): Promise<void> {
    if (
      !this.hubConnection ||
      this.hubConnection.state !== signalR.HubConnectionState.Connected
    ) {
      throw new Error("Hub connection is not connected");
    }
    return this.hubConnection.send(methodName, ...args);
  }

  // Getters
  get IsConnected(): boolean {
    return this.isConnected;
  }
  get IsConnecting(): boolean {
    return this.isConnecting;
  }
  get HubConnection(): signalR.HubConnection | null {
    return this.hubConnection;
  }
}
