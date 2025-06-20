import { useCallback, useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import signalRService from "./SignalRService";
import { SignalRCallbackExtensions } from "./signalRCallbackExtensions";
import { useNotification } from "../../context/notificationContext";
import NotificationService from "../NotificationService/NotificationService";

/**
 * Custom hook for managing SignalR connection and events
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Whether to auto-connect on mount (default: true)
 * @param {Array} options.groups - Array of groups to join on connection
 * @param {Object} options.eventHandlers - Object mapping event names to handler functions
 */
export const useSignalR = (options = {}) => {
  const { groups = [], eventHandlers = {} } = options;
  const { setNotifications } = useNotification();
  const subscription = useRef(null);

  // Add protection refs to prevent race conditions
  const isComponentMounted = useRef(true);
  const connectionOperationInProgress = useRef(false);
  const timeoutRefs = useRef([]);

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    connectionId: null,
  });

  // Helper to manage timeouts with cleanup
  const addTimeout = useCallback((callback, delay) => {
    const timeoutId = setTimeout(() => {
      if (isComponentMounted.current) {
        // Handle promise properly
        Promise.resolve(callback()).catch((error) => {
          console.error("🔔 Timeout callback error:", error);
        });
      }
      // Remove from refs array
      timeoutRefs.current = timeoutRefs.current.filter(
        (id) => id !== timeoutId
      );
    }, delay);

    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Update connection status - stabilized with no dependencies
  const updateConnectionStatus = useCallback(() => {
    if (isComponentMounted.current) {
      setConnectionStatus(signalRService.getConnectionStatus());
    }
  }, []);

  // Handle incoming notifications - stabilized with setNotifications dependency
  const handleNotification = useCallback(
    (notification) => {
      console.log("Method invoked", notification, isComponentMounted.current);
      if (isComponentMounted.current) {
        setNotifications((prevNotifications) => {
          const updatedNotifications = [notification, ...prevNotifications];
          console.log("updatedNotifications", updatedNotifications);
          SignalRCallbackExtensions.SaveNotificationsAsync(
            updatedNotifications
          );
          return updatedNotifications;
        });
      }
    },
    [setNotifications]
  );

  // Connection control methods with race condition protection
  const connect = useCallback(async () => {
    if (connectionOperationInProgress.current || !isComponentMounted.current) {
      console.log(
        "🔔 Connection operation already in progress or component unmounted, skipping"
      );
      return;
    }

    connectionOperationInProgress.current = true;
    try {
      console.log("🔔 SignalR: Connecting...");
      await signalRService.startConnection();
    } finally {
      connectionOperationInProgress.current = false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (connectionOperationInProgress.current || !isComponentMounted.current) {
      console.log(
        "🔔 Disconnect operation already in progress or component unmounted, skipping"
      );
      return;
    }

    connectionOperationInProgress.current = true;
    try {
      console.log("🔔 SignalR: Disconnecting...");
      await signalRService.stopConnection();
    } finally {
      connectionOperationInProgress.current = false;
    }
  }, []);

  const joinGroup = useCallback(async (groupName) => {
    if (!signalRService.isConnected) {
      console.warn(`🔔 Cannot join group ${groupName} - not connected`);
      return false;
    }
    console.log("🔔 Joining group", groupName);
    return await signalRService.addToGroup(groupName);
  }, []);

  const leaveGroup = useCallback(async (groupName) => {
    if (!signalRService.isConnected) {
      console.warn(`🔔 Cannot leave group ${groupName} - not connected`);
      return false;
    }
    console.log("🔔 Leaving group", groupName);
    return await signalRService.removeFromGroup(groupName);
  }, []);

  // Helper to handle multiple groups safely - stabilized with groups dependency
  const joinAllGroups = useCallback(async () => {
    if (!signalRService.isConnected || !isComponentMounted.current) {
      console.warn(
        "🔔 Cannot join groups - not connected or component unmounted"
      );
      return;
    }

    for (const group of groups) {
      if (signalRService.isConnected && isComponentMounted.current) {
        await joinGroup(group);
      }
    }
  }, [groups, joinGroup]);

  const leaveAllGroups = useCallback(async () => {
    if (!signalRService.isConnected || !isComponentMounted.current) {
      console.warn(
        "🔔 Cannot leave groups - not connected or component unmounted"
      );
      return;
    }

    for (const group of groups) {
      if (signalRService.isConnected && isComponentMounted.current) {
        await leaveGroup(group);
      }
    }
  }, [groups, leaveGroup]);

  // Event handlers - stabilized with proper dependencies
  const handleOnConnected = useCallback(async () => {
    console.log("🔔 SignalR Connected");
    updateConnectionStatus();
    addTimeout(async () => {
      if (signalRService.isConnected) {
        await joinAllGroups();
      }
    }, 1000);
    addTimeout(async () => {
      const deviceId = await NotificationService.getDeviceId();
      if (signalRService.isConnected) {
        const notifications = await signalRService.GetStoredNotifications(
          deviceId
        );
        setNotifications((prevNotifications) => {
          const updatedNotifications = [...prevNotifications, ...notifications];
          return updatedNotifications;
        });
      }
    }, 1000);
  }, [updateConnectionStatus, addTimeout, joinAllGroups]);

  const handleOnReconnected = useCallback(async () => {
    updateConnectionStatus();
    addTimeout(async () => {
      if (signalRService.isConnected) {
        await joinAllGroups();
      }
    }, 1000);
  }, [updateConnectionStatus, addTimeout, joinAllGroups]);

  // AppState change handler - stabilized with proper dependencies
  const handleAppStateChange = useCallback(
    async (nextAppState) => {
      console.log(`🔔 AppState changed to: ${nextAppState}`);

      if (!isComponentMounted.current) {
        console.log("🔔 Component unmounted, ignoring AppState change");
        return;
      }

      try {
        if (nextAppState === "background" || nextAppState === "inactive") {
          console.log("🔔 App going to background - disconnecting SignalR");
          await leaveAllGroups();

          await disconnect();
        } else if (nextAppState === "active") {
          console.log("🔔 App returning to active - reconnecting SignalR");

          // Debounce reconnection to avoid rapid state changes
          addTimeout(async () => {
            if (!signalRService.isConnected && isComponentMounted.current) {
              await connect();

              // Wait for connection to establish before joining groups
              addTimeout(async () => {
                if (signalRService.isConnected && isComponentMounted.current) {
                  await joinAllGroups();
                }
              }, 1000);
            }
          }, 300);
        }
      } catch (error) {
        console.error("🔔 AppState change error:", error);
      }
    },
    [connect, disconnect, joinAllGroups, leaveAllGroups, addTimeout]
  );

  // Main useEffect - empty dependency array to prevent re-runs
  useEffect(() => {
    isComponentMounted.current = true;

    const setupEverything = async () => {
      try {
        console.log("🔔 Setting up SignalR hook");

        // Setup event handlers with proper references for cleanup
        signalRService.onEvent("onConnected", handleOnConnected);
        signalRService.onEvent("onDisconnected", updateConnectionStatus);
        signalRService.onEvent("onReconnected", handleOnReconnected);
        signalRService.onEvent("onReconnecting", updateConnectionStatus);
        signalRService.onEvent("onConnectionFailed", updateConnectionStatus);
        signalRService.onEvent(
          "onMaxReconnectAttemptsReached",
          updateConnectionStatus
        );
        signalRService.onEvent("onNotificationReceived", handleNotification);

        // Setup custom event handlers
        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
          signalRService.onEvent(eventName, handler);
        });

        // Setup AppState listener
        subscription.current = AppState.addEventListener(
          "change",
          handleAppStateChange
        );
      } catch (error) {
        console.error("🔔 Setup error:", error);
      }
    };

    setupEverything();

    // Cleanup function
    return () => {
      console.log("🔔 useSignalR cleanup starting");
      isComponentMounted.current = false;

      // Clear all pending timeouts
      timeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current = [];

      // Remove AppState listener
      if (subscription.current) {
        subscription.current.remove();
      }

      // Remove SignalR event handlers with correct references
      signalRService.offEvent("onConnected", handleOnConnected);
      signalRService.offEvent("onDisconnected", updateConnectionStatus);
      signalRService.offEvent("onReconnected", handleOnReconnected);
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

      (async () => {
        try {
          if (signalRService.isConnected) {
            console.log("Cleanup: leaving groups and disconnecting");
            for (const group of groups) {
              if (signalRService.isConnected) {
                await signalRService.removeFromGroup(group);
              }
            }
            await signalRService.stopConnection();
          }
        } catch (error) {
          console.error("🔔 Cleanup error:", error);
        }
      })();
    };
  }, []); // Empty dependency array - only run once on mount/unmount

  return {
    connectionStatus,
    handleNotification,
    signalRService,
    // Expose these for advanced usage if needed
    connect,
    disconnect,
    joinGroup,
    leaveGroup,
  };
};

export default useSignalR;
