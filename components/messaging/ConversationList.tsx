import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConversationMetadata } from "../../types/messaging.types";

interface ConversationListProps {
  conversations: ConversationMetadata[];
  selectedConversation: ConversationMetadata | null;
  onConversationSelect: (conversation: ConversationMetadata) => void;
  loading: boolean;
  currentUserId: number | null;
}

interface ConversationItemProps {
  conversation: ConversationMetadata;
  isSelected: boolean;
  onSelect: () => void;
  currentUserId: number | null;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  currentUserId,
}) => {
  // Determine which participant info to show (the other person)
  const otherParticipant = conversation.members.find(
    (member) => member.userId !== currentUserId
  );
  const displayName = otherParticipant?.userName || "Unknown User";
  const displayAvatar =
    currentUserId === conversation.creatorId
      ? conversation.avatarTwo
      : conversation.avatarOne;

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp) return "";

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now.getTime() - messageTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? "Now" : `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const getTypingText = () => {
    if (conversation.whosTyping && conversation.whosTyping.length > 0) {
      const typingUsers = conversation.whosTyping
        .filter((typing) => typing.userId !== currentUserId)
        .map((typing) => typing.userName);

      if (typingUsers.length > 0) {
        return typingUsers.length === 1
          ? `${typingUsers[0]} is typing...`
          : `${typingUsers.length} people are typing...`;
      }
    }
    return null;
  };

  const typingText = getTypingText();

  return (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        isSelected && styles.selectedConversation,
        conversation.newMessageUnread && styles.unreadConversation,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              displayAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                displayName
              )}&background=2558B6&color=fff&size=50&format=png`,
          }}
          style={styles.avatar}
        />
        {conversation.isOnline && <View style={styles.onlineIndicator} />}
        {conversation.newMessageUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>•</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text
            style={[
              styles.participantName,
              conversation.newMessageUnread && styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(conversation.timestamp)}
          </Text>
        </View>

        <View style={styles.messagePreview}>
          {typingText ? (
            <Text style={styles.typingText} numberOfLines={1}>
              {typingText}
            </Text>
          ) : (
            <Text
              style={[
                styles.lastMessage,
                conversation.newMessageUnread && styles.unreadText,
              ]}
              numberOfLines={1}
            >
              {conversation.lastMessageSenderName &&
              conversation.lastMessageSenderName !== displayName
                ? `You: ${conversation.lastMessage || "No messages yet"}`
                : conversation.lastMessage || "No messages yet"}
            </Text>
          )}
        </View>
      </View>

      {conversation.newMessageUnread && (
        <View style={styles.unreadIndicator}>
          <Ionicons name="ellipse" size={8} color="#FF7345" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  loading,
  currentUserId,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7345" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Start messaging by creating a new conversation
        </Text>
      </View>
    );
  }

  const renderConversationItem = ({ item }: { item: ConversationMetadata }) => (
    <ConversationItem
      conversation={item}
      isSelected={selectedConversation?.id === item.id}
      onSelect={() => onConversationSelect(item)}
      currentUserId={currentUserId}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color="#FF7345" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        style={styles.conversationsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  newMessageButton: {
    padding: 8,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "white",
  },
  selectedConversation: {
    backgroundColor: "#FFF8F6",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7345",
  },
  unreadConversation: {
    backgroundColor: "#FAFAFA",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF7345",
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
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
  participantName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  typingText: {
    fontSize: 14,
    color: "#FF7345",
    fontStyle: "italic",
    flex: 1,
  },
  unreadText: {
    fontWeight: "600",
    color: "#333",
  },
  unreadIndicator: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ConversationList;
