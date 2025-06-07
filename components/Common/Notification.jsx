import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Badge } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import NotificationPanel from "./NotificationPanel";
import signalRService from "../../Services/SignalRService/SignalRService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Notification = ({ style }) => {
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);

  // Handle incoming real-time notifications
  const handleIncomingNotification = useCallback((notification) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [notification, ...prevNotifications];
      saveNotifications(updatedNotifications);
      return updatedNotifications;
    });
  }, []);

  // Initialize SignalR connection and setup event handlers
  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        // Set up event handlers
        signalRService.onEvent("onConnected", () => {
          console.log("Notification: SignalR connected");
          setIsSignalRConnected(true);
          initializeUserGroups();
        });

        signalRService.onEvent("onDisconnected", () => {
          console.log("Notification: SignalR disconnected");
          setIsSignalRConnected(false);
        });

        signalRService.onEvent("onReconnected", () => {
          console.log("Notification: SignalR reconnected");
          setIsSignalRConnected(true);
          initializeUserGroups();
        });

        signalRService.onEvent(
          "onNotificationReceived",
          handleIncomingNotification
        );

        // Start connection
        await signalRService.startConnection();
      } catch (error) {
        console.error("Notification: Failed to initialize SignalR", error);
      }
    };

    // Load existing notifications from storage
    loadStoredNotifications();

    // Initialize SignalR
    initializeSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.offEvent("onConnected", () => setIsSignalRConnected(true));
      signalRService.offEvent("onDisconnected", () =>
        setIsSignalRConnected(false)
      );
      signalRService.offEvent("onReconnected", () =>
        setIsSignalRConnected(true)
      );
      signalRService.offEvent(
        "onNotificationReceived",
        handleIncomingNotification
      );
    };
  }, [handleIncomingNotification]);

  // Initialize user-specific SignalR groups
  const initializeUserGroups = async () => {
    try {
      // Join job seeker specific group if user is a job seeker
      const userRole = await AsyncStorage.getItem("userRole");
      if (userRole === "jobseeker" || !userRole) {
        await signalRService.addToGroup("jobseekers");
        console.log("Joined jobseekers group");
      }
    } catch (error) {
      console.error("Failed to join user groups:", error);
    }
  };

  // Load notifications from storage
  const loadStoredNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem("notifications");
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Convert timestamp strings back to Date objects
        const notifications = parsed.map((notif) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
        }));
        setNotifications(notifications);
      } else {
        // Load mock data if no stored notifications
        loadMockNotifications();
      }
    } catch (error) {
      console.error("Failed to load stored notifications:", error);
      loadMockNotifications();
    }
  };

  // Load mock notifications for demo
  const loadMockNotifications = () => {
    const mockNotifications = [
      {
        id: "1",
        type: "job",
        title: "Có việc làm mới phù hợp",
        message: "Nhân viên phục vụ - Quán Café Highlands tại Quận 1, TP.HCM",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false,
      },
      {
        id: "2",
        type: "application",
        title: "Đơn ứng tuyển được chấp nhận",
        message:
          "Chúc mừng! Đơn ứng tuyển của bạn cho vị trí Nhân viên bán hàng đã được chấp nhận.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isRead: false,
      },
      {
        id: "3",
        type: "message",
        title: "Tin nhắn mới từ nhà tuyển dụng",
        message: "Công ty ABC muốn trao đổi thêm về vị trí ứng tuyển của bạn.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isRead: true,
      },
      {
        id: "4",
        type: "schedule",
        title: "Lịch phỏng vấn sắp tới",
        message:
          "Bạn có lịch phỏng vấn vào lúc 2:00 PM ngày mai tại Công ty XYZ.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        isRead: true,
      },
    ];
    // setNotifications(mockNotifications);
    // saveNotifications(mockNotifications);
  };

  // Save notifications to storage
  const saveNotifications = async (updatedNotifications) => {
    try {
      await AsyncStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  const handleNotificationPress = () => {
    setIsPanelVisible(true);
  };

  const handleClosePanel = () => {
    setIsPanelVisible(false);
  };

  const handleNotificationItemPress = (notification) => {
    // Mark notification as read
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notification.id ? { ...notif, isRead: true } : notif
    );
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);

    // Handle navigation based on notification type
    switch (notification.type) {
      case "job":
        // Navigate to job details
        console.log("Navigate to job details:", notification);
        break;
      case "message":
        // Navigate to messages
        console.log("Navigate to messages:", notification);
        break;
      case "schedule":
        // Navigate to schedule
        console.log("Navigate to schedule:", notification);
        break;
      case "application":
        // Navigate to applications
        console.log("Navigate to applications:", notification);
        break;
      case "feedback":
        // Navigate to feedback
        console.log("Navigate to feedback:", notification);
        break;
      case "profile":
        // Navigate to profile
        console.log("Navigate to profile:", notification);
        break;
      default:
        console.log("Default notification action:", notification);
    }
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((notif) => ({
      ...notif,
      isRead: true,
    }));
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handleNotificationPress}
        activeOpacity={0.7}
      >
        {unreadCount > 0 && (
          <Badge style={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={30} color="white" />
          {/* Connection status indicator */}
          <View
            style={[
              styles.connectionIndicator,
              { backgroundColor: isSignalRConnected ? "#4CAF50" : "#F44336" },
            ]}
          />
        </View>
      </TouchableOpacity>

      <NotificationPanel
        isVisible={isPanelVisible}
        onClose={handleClosePanel}
        notifications={notifications}
        onNotificationPress={handleNotificationItemPress}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "20%",
    alignItems: "center",
    position: "relative",
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    left: 39,
    top: -8,
    zIndex: 1,
    backgroundColor: "#FF7345",
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    textAlignVertical: "center",
  },
  connectionIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "white",
  },
});

export default Notification;
