import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
} from "react-native";
import { useMessaging } from "../../context/MessagingContext";
import ConversationList from "./ConversationList";
import ChatScreen from "./ChatScreen";
import UserSearchScreen from "./UserSearchScreen"; // Import the new component
import ServerDataDemoScreen from "../../Screen/ServerDataDemoScreen";

const MessagingContainer = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false); // New state for the search modal

  const { createConversation, isConnected, currentUser } = useMessaging();

  const handleConversationSelect = useCallback((conversation) => {
    setSelectedConversationId(conversation.id);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  // New handler to create a conversation with a selected user
  const handleCreateConversationWithUser = async (selectedUser) => {
    console.log("Attempting to create conversation with user:", selectedUser); // Log selected user
    try {
      // Prepare the conversation data according to API spec
      const conversationData = {
        creatorId: currentUser?.id?.toString(),
        members: {
          [currentUser.id]: currentUser.name,
          [selectedUser.userId]: selectedUser.fullName,
        },
        conversationNameOne: currentUser?.name,
        conversationNameTwo: selectedUser.fullName,
        avatarOne: currentUser?.avatar || "",
        avatarTwo: selectedUser.avatar || "",
        createdAt: new Date().toISOString(),
      };

      console.log("Conversation data payload:", conversationData); // Log payload

      const newConversation = await createConversation(conversationData);

      console.log("New conversation created:", newConversation); // Log response

      // Close the search modal and navigate to the new chat
      setShowUserSearch(false);
      setSelectedConversationId(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation with user:", error);
      Alert.alert("Lỗi", "Không thể tạo cuộc trò chuyện. Vui lòng thử lại.");
    }
  };

  if (selectedConversationId) {
    return (
      <ChatScreen
        conversationId={selectedConversationId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MessagingHeader
        onNewConversation={() => setShowUserSearch(true)} // Open the new search modal
        isConnected={isConnected}
      />
      <ConversationList onConversationSelect={handleConversationSelect} />
      <ServerDataDemoScreen />

      {/* New User Search Modal */}
      <Modal
        visible={showUserSearch}
        animationType="slide"
        onRequestClose={() => setShowUserSearch(false)}
      >
        <UserSearchScreen
          onSelectUser={handleCreateConversationWithUser}
          onClose={() => setShowUserSearch(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

// Header component for messaging screen (Remains the same)
const MessagingHeader = ({ onNewConversation, isConnected }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tin nhắn</Text>

      <View style={styles.headerRight}>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? "#4CAF50" : "#FF3B30" },
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? "Đã kết nối" : "Ngoại tuyến"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={onNewConversation}
          activeOpacity={0.7}
        >
          <Text style={styles.newChatButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 12,
    color: "#666666",
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  newChatButtonText: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "300",
  },
});

export default MessagingContainer;
