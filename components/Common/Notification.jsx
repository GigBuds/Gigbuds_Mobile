import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Badge } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import NotificationPanel from "./NotificationPanel";
import { useSignalR } from "../../Services/SignalRService/useSignalR";
import { useNavigation } from "@react-navigation/native";
import { Portal } from "react-native-portalize";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Notification = ({ style }) => {
  const navigate = useNavigation();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const {
    connect,
    disconnect,
    joinGroup,
    leaveGroup,
    notifications,
    setNotifications,
    loadStoredNotifications,
    saveNotifications,
    connectionStatus,
  } = useSignalR({
    autoConnect: true,
    groups: ["jobseekers"],
  });

  useEffect(() => {
    connect();
    joinGroup("jobseekers");
    loadStoredNotifications();

    return () => {
      leaveGroup("jobseekers");
      disconnect();
    };
  }, [connect, joinGroup, leaveGroup, disconnect]);

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

    switch (notification.type) {
      case "job":
        console.log(notification.additionalPayload);
        navigate.navigate("JobDetail", {
          jobId: notification.additionalPayload,
        });
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

  const handleDeleteAll = async () => {
    await AsyncStorage.removeItem("notifications");
    setNotifications([]);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handleNotificationPress}
        activeOpacity={0.8}
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
              {
                backgroundColor: connectionStatus.isConnected
                  ? "#4CAF50"
                  : "#F44336",
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      <Portal>
        <NotificationPanel
          isVisible={isPanelVisible}
          onClose={handleClosePanel}
          notifications={notifications}
          onNotificationPress={handleNotificationItemPress}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDeleteAll={handleDeleteAll}
        />
      </Portal>
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
