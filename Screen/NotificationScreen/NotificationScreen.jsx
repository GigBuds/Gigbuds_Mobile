import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNotification } from "../../context/notificationContext";
import NotificationItem from "../../components/Common/NotificationItem";
import HeaderLayout from "../../layout/HeaderLayout";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

const NotificationScreen = () => {
  const { notifications, setNotifications } = useNotification();
  const navigate = useNavigation();
  const handleNotificationPress = (notification) => {
    // Mark notification as read
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notification.id ? { ...notif, isRead: true } : notif
    );
    setNotifications(updatedNotifications);

    // Handle navigation based on notification type
    switch (notification.type) {
      case "job":
        console.log("Navigate to job details:", notification);
        navigate.navigate("JobDetail", {
          jobId: notification.additionalPayload?.jobPostId,
        });
        break;
      case "message":
        console.log("Navigate to messages:", notification);
        break;
      case "schedule":
        console.log("Navigate to schedule:", notification);
        break;
      case "application":
        console.log("Navigate to applications:", notification);
        break;
      case "feedback":
        console.log("Navigate to feedback:", notification);
        break;
      case "profile":
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
  };

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  const renderNotification = ({ item }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="notifications-none" size={80} color="#ccc" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubText}>Thông báo mới sẽ xuất hiện ở đây</Text>
    </View>
  );

  return (
    <HeaderLayout
      title="Thông báo"
      showBackButton={false}
      rightComponent={
        notifications.length > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
        )
      }
    >
      <View style={styles.wrapper}>
        <View style={styles.container}>
          {unreadCount > 0 && (
            <View style={styles.headerInfo}>
              <Text style={styles.unreadText}>
                Bạn có {unreadCount} thông báo chưa đọc
              </Text>
            </View>
          )}

          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) =>
              item.id?.toString() || Math.random().toString()
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={
              notifications.length === 0 ? styles.emptyList : styles.list
            }
            style={styles.flatList}
            removeClippedSubviews={false}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate height of each notification item
              offset: 80 * index,
              index,
            })}
          />
        </View>
      </View>
    </HeaderLayout>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: -20, // Negative margin to counteract HeaderLayout's padding
    backgroundColor: "#F3F7FF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F7FF",
    paddingTop: 20, // Add back top padding
  },
  headerInfo: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  unreadText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  flatList: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 0,
    paddingBottom: 100, // Increased bottom padding to prevent clipping by tab bar
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: "#FF7345",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default NotificationScreen;
