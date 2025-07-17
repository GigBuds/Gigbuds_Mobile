import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useMessaging } from "../../context/MessagingContext";

const ConversationList = ({ onConversationSelect }) => {
  const {
    conversations,
    loadConversations,
    conversationsLoading,
    conversationsError,
    currentUser,
    isConnected,
    deleteConversation,
    typingUsers,
  } = useMessaging();

  useEffect(() => {
    // Only load conversations when both user is authenticated AND SignalR is connected
    if (currentUser && isConnected) {
      console.log(
        "🔗 SignalR connected and user authenticated - loading conversations"
      );
      loadConversations();
    } else {
      console.log("⏳ Waiting for SignalR connection and user auth:", {
        hasUser: !!currentUser,
        isConnected,
      });
    }
  }, [currentUser, isConnected]);

  // Debug: Log typing users state
  useEffect(() => {
    if (Object.keys(typingUsers).length > 0) {
      console.log("👀 Current typing users state:", typingUsers);
    }
  }, [typingUsers]);

  const handleDeleteConversation = (item) => {
    const otherUserName = getOtherUserName(item, currentUser);

    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete the conversation with ${otherUserName}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(item.id);
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete conversation. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const renderConversation = ({ item }) => {
    const otherUserName = getOtherUserName(item, currentUser);
    const otherUserAvatar = getOtherUserAvatar(item, currentUser);
    const unreadCount = item.newMessageUnread ? 1 : 0;

    // Get typing users for this conversation
    const conversationTypingUsers = typingUsers[item.id] || {};
    const typingUserNames = Object.values(conversationTypingUsers)
      .map((user) => user.userName)
      .filter((name) => name && name !== currentUser?.name); // Exclude current user

    // Debug: Log typing users for this conversation
    if (typingUserNames.length > 0) {
      console.log(`👀 Conversation ${item.id} typing users:`, typingUserNames);
    }

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => {
          console.log(
            "🐛 ConversationList TouchableOpacity pressed for item:",
            item.id
          );
          console.log(
            "🐛 onConversationSelect function:",
            typeof onConversationSelect
          );
          onConversationSelect(item);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: otherUserAvatar || "https://via.placeholder.com/50",
            }}
            style={styles.avatar}
          />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {otherUserName}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || "No messages yet"}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {/* Typing indicator */}
          {typingUserNames.length > 0 && (
            <View style={styles.typingContainer}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
              <Text style={styles.typingText}>
                {getTypingDisplayText(typingUserNames)} is typing...
              </Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (conversationsError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load conversations</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadConversations()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        refreshing={conversationsLoading}
        onRefresh={() => loadConversations()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation to begin messaging
            </Text>
          </View>
        }
      />
    </View>
  );
};

// Helper functions
const getTypingDisplayText = (typingUserNames) => {
  if (!typingUserNames || typingUserNames.length === 0) return "";

  // typingUserNames is already a clean array of strings
  const userNames = typingUserNames.filter((name) => name && name.trim()); // Remove empty names

  if (userNames.length === 0) return "";
  if (userNames.length === 1) return userNames[0];
  if (userNames.length === 2) return `${userNames[0]} and ${userNames[1]}`;
  return `${userNames.length} people`;
};

const getOtherUserName = (conversation, currentUser) => {
  if (!currentUser) {
    return conversation.nameOne || "Unknown";
  }

  // Handle members as either array of objects or key-value mapping
  const members = conversation.members || [];

  // If members is an array of user objects
  if (Array.isArray(members)) {
    const otherUser = members.find(
      (member) =>
        member &&
        member.userId &&
        member.userId.toString() !== currentUser.id.toString()
    );

    if (otherUser && otherUser.userName) {
      return String(otherUser.userName);
    }
  } else {
    // If members is a key-value object (legacy format)
    const memberIds = Object.keys(members);
    for (const memberId of memberIds) {
      if (memberId !== currentUser.id.toString()) {
        const memberName = members[memberId];
        if (typeof memberName === "string") {
          return memberName;
        } else if (typeof memberName === "object" && memberName.userName) {
          return String(memberName.userName);
        }
      }
    }
  }

  // Fallback to conversation names
  return conversation.nameOne !== currentUser.name
    ? conversation.nameOne
    : conversation.nameTwo || "Unknown";
};

const getOtherUserAvatar = (conversation, currentUser) => {
  if (!currentUser) return conversation.avatarOne;

  // Simple logic to get the other user's avatar
  return conversation.avatarOne !== currentUser.avatar
    ? conversation.avatarOne
    : conversation.avatarTwo;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffInHours < 168) {
    // 7 days
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#ffffff",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e1e1e1",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  conversationContent: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#999999",
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "600",
    color: "#333333",
  },
  unreadBadge: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  typingDots: {
    flexDirection: "row",
    marginRight: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#007AFF",
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  typingText: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    alignSelf: "center",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 18,
  },
});

export default ConversationList;
