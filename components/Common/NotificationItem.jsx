import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import PropTypes from "prop-types";

const NotificationItem = ({ notification, onPress }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "job":
        return "briefcase-outline";
      case "message":
        return "chatbubble-outline";
      case "schedule":
        return "calendar-outline";
      case "application":
        return "document-outline";
      default:
        return "notifications-outline";
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMs = now - notificationTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${diffInDays} ngày trước`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unreadContainer]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={24}
          color={notification.isRead ? "#666" : "#FF7345"}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text
          style={[styles.title, !notification.isRead && styles.unreadTitle]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.content}
        </Text>
        <Text style={styles.timestamp}>
          {formatTimeAgo(notification.timestamp)}
        </Text>
      </View>

      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]).isRequired,
    isRead: PropTypes.bool.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 80,
  },
  unreadContainer: {
    backgroundColor: "#FFF8F6",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7345",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: "600",
    color: "#000",
  },
  message: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7345",
    alignSelf: "center",
    marginLeft: 8,
    marginRight: 4,
  },
});

export default NotificationItem;
