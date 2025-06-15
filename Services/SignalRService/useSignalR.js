import { useCallback, useEffect, useState } from "react";
import signalRService from "./SignalRService";
import { SignalRCallbackExtensions } from "./signalRCallbackExtensions";
import { useNotification } from "../../context/notificationContext";

/**
 * Custom hook for managing SignalR connection and events
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Whether to auto-connect on mount (default: true)
 * @param {Array} options.groups - Array of groups to join on connection
 * @param {Object} options.eventHandlers - Object mapping event names to handler functions
 */
export const useSignalR = (options = {}) => {
  const { groups = [], eventHandlers = {} } = options;
  const { notifications, setNotifications } = useNotification();

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    connectionId: null,
  });

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    setConnectionStatus(signalRService.getConnectionStatus());
  }, []);

  // Handle incoming notifications
  const handleNotification = useCallback((notification) => {
    const updatedNotifications = [notification, ...notifications];
    console.log("updatedNotifications", updatedNotifications);
    setNotifications(updatedNotifications);
    SignalRCallbackExtensions.SaveNotificationsAsync(updatedNotifications);
  }, []);

  // Set up event handlers
  useEffect(() => {
    const setupEventHandlers = () => {
      // Connection events
      signalRService.onEvent("onConnected", async () => {
        console.log("onConnected");
        updateConnectionStatus();
      });

      signalRService.onEvent("onDisconnected", updateConnectionStatus);
      signalRService.onEvent("onReconnected", () => {
        updateConnectionStatus();
        // Re-join groups after reconnection
        groups.forEach((group) => {
          signalRService.addToGroup(group);
        });
      });

      signalRService.onEvent("onReconnecting", updateConnectionStatus);
      signalRService.onEvent("onConnectionFailed", updateConnectionStatus);
      signalRService.onEvent(
        "onMaxReconnectAttemptsReached",
        updateConnectionStatus
      );

      // Notification events
      signalRService.onEvent("onNotificationReceived", handleNotification);

      // Custom event handlers
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        signalRService.onEvent(eventName, handler);
      });
    };

    setupEventHandlers();

    // Cleanup on unmount
    return () => {
      signalRService.offEvent("onConnected", updateConnectionStatus);
      signalRService.offEvent("onDisconnected", updateConnectionStatus);
      signalRService.offEvent("onReconnected", updateConnectionStatus);
      signalRService.offEvent("onReconnecting", updateConnectionStatus);
      signalRService.offEvent("onConnectionFailed", updateConnectionStatus);
      signalRService.offEvent(
        "onMaxReconnectAttemptsReached",
        updateConnectionStatus
      );
      signalRService.offEvent("onNotificationReceived", handleNotification);

      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        signalRService.offEvent(eventName, handler);
      });
    };
  }, []);

  // Connection control methods
  const connect = useCallback(async () => {
    await signalRService.startConnection();
  }, []);

  const disconnect = useCallback(async () => {
    await signalRService.stopConnection();
  }, []);

  const joinGroup = useCallback(async (groupName) => {
    console.log("Joining group", groupName);
    return await signalRService.addToGroup(groupName);
  }, []);

  const leaveGroup = useCallback(async (groupName) => {
    console.log("Leaving group", groupName);
    return await signalRService.removeFromGroup(groupName);
  }, []);

  const updateAuth = useCallback(async () => {
    await signalRService.updateAuthToken();
  }, []);

  return {
    // Connection state
    connectionStatus,

    // Notifications
    handleNotification,

    // Connection controls
    connect,
    disconnect,
    joinGroup,
    leaveGroup,
    updateAuth,

    // Service instance (for advanced usage)
    signalRService,
  };
};

export default useSignalR;
