import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const MessageBubble = ({
  message,
  currentUser,
  showAvatar = true,
  showTimestamp = true,
  onLongPress,
  onPress,
}) => {
  const isOwnMessage =
    message?.senderId?.toString() === currentUser?.id?.toString();

  // Debug: Log message and ownership check (commented out for performance)
  // console.log("[MessageBubble render]", {
  //   messageId: message?.messageId,
  //   senderId: message?.senderId,
  //   currentUserId: currentUser?.id,
  //   isOwnMessage,
  //   content: message?.content,
  // });
  const showSenderAvatar = !isOwnMessage && showAvatar;

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeliveryStatusIcon = () => {
    if (!message?.deliveryStatus) return "";
    switch (message.deliveryStatus) {
      case "Sending": // Pending
        return "";
      case "Delivered": // Delivered
        return "✓";
      case "Read": // Read
        return "✓✓";
      default:
        return "";
    }
  };

  const getDeliveryStatusColor = () => {
    if (!message?.deliveryStatus) return "#999999";
    switch (message.deliveryStatus) {
      case "Sending": // Pending
        return "#999999";
      case "Delivered": // Delivered
        return "#666666";
      case "Read": // Read
        return "#007AFF";
      default:
        return "#999999";
    }
  };

  return (
    <View
      style={[styles.container, isOwnMessage && styles.ownMessageContainer]}
    >
      {/* Avatar for received messages */}
      {showSenderAvatar && (
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: message.senderAvatar || "https://via.placeholder.com/32",
            }}
            style={styles.avatar}
          />
        </View>
      )}

      {/* Message content */}
      <TouchableOpacity
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          !showSenderAvatar && styles.messageBubbleWithoutAvatar,
          message?.isDeleted && styles.deletedMessageBubble,
        ]}
        onPress={() => {
          if (onPress) onPress(message);
        }}
        onLongPress={() => {
          // Only allow long press on own messages that aren't deleted
          if (isOwnMessage && !message?.isDeleted && onLongPress) {
            onLongPress(message);
          }
        }}
        activeOpacity={message?.isDeleted ? 1 : 0.7}
      >
        {/* Sender name for received messages */}
        {!isOwnMessage && message?.senderName && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        {/* Message text */}
        <Text
          style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            message?.isDeleted && styles.deletedMessageText,
          ]}
        >
          {message?.isDeleted
            ? "Tin nhắn này đã được xóa"
            : message?.content || ""}
        </Text>

        {/* Timestamp and delivery status */}
        <View style={styles.messageFooter}>
          {showTimestamp && message?.timestamp && (
            <Text
              style={[
                styles.timestamp,
                isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>
          )}

          {/* Delivery status for own messages */}
          {isOwnMessage && message?.deliveryStatus !== undefined && (
            <Text
              style={[
                styles.deliveryStatus,
                { color: getDeliveryStatusColor() },
              ]}
            >
              {getDeliveryStatusIcon()}
            </Text>
          )}
        </View>

        {/* Message edited indicator */}
        {message?.isEdited && (
          <Text style={styles.editedIndicator}>đã chỉnh sửa</Text>
        )}
      </TouchableOpacity>

      {/* Spacer for own messages to align them right */}
      {isOwnMessage && <View style={styles.spacer} />}
    </View>
  );
};

// const MessageBubbleGroup = ({
//   messages,
//   currentUser,
//   onMessageLongPress,
//   onMessagePress,
// }) => {
//   if (!messages || !Array.isArray(messages) || messages.length === 0)
//     return null;

//   return (
//     <View style={styles.groupContainer}>
//       {messages.map((message, index) => {
//         if (!message || !message.messageId) return null;

//         const isFirst = index === 0;
//         const isLast = index === messages.length - 1;
//         const showAvatar = isLast && message?.senderId !== currentUser?.id;
//         const showTimestamp = isLast;

//         return (
//           <MessageBubble
//             key={message.messageId}
//             message={message}
//             currentUser={currentUser}
//             showAvatar={showAvatar}
//             showTimestamp={showTimestamp}
//             onLongPress={() => onMessageLongPress?.(message)}
//             onPress={() => onMessagePress?.(message)}
//           />
//         );
//       })}
//     </View>
//   );
// };

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 2,
    paddingHorizontal: 16,
    alignItems: "flex-end",
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e1e1e1",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
    marginVertical: 1,
  },
  messageBubbleWithoutAvatar: {
    marginLeft: 40, // Space for avatar
  },
  ownMessage: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#F2F2F7",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#000000",
  },
  deletedMessageText: {
    color: "#999999",
    fontStyle: "italic",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  ownTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: "#999999",
  },
  deliveryStatus: {
    fontSize: 12,
    marginLeft: 4,
  },
  editedIndicator: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#999999",
    marginTop: 2,
    alignSelf: "flex-end",
  },
  spacer: {
    width: 40, // Space for avatar on the other side
  },
  groupContainer: {
    marginVertical: 4,
  },
  deletedMessageBubble: {
    opacity: 0.5,
    backgroundColor: "#E0E0E0", // A light gray background for deleted messages
  },
});

export { MessageBubble };
// export { MessageBubble, MessageBubbleGroup };
export default MessageBubble;
