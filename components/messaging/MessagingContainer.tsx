import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, Alert } from "react-native";
import { useUser } from "../../context/UserContext";
import { useMessaging } from "../../context/MessagingContext";

import ConversationList from "./ConversationList";
import ChatContainer from "./ChatContainer";
import {
  messagingSignalRService,
  MESSAGING_EVENTS,
} from "../../Services/MessagingSignalRService/MessagingSignalRService";
import { databaseService } from "../../Services/database/DatabaseService";
import { ConversationMetadata } from "../../types/messaging.types";

/**
 * MAIN MESSAGING CONTAINER
 *
 * State Variables:
 * - selectedConversation: Currently active conversation for chat view
 * - conversations: Array of all user conversations sorted by last activity
 * - loading: Loading state for conversation list
 *
 * Process Workflow:
 * 1. Initialize SignalR connection on mount
 * 2. Load conversations from local database
 * 3. Register global SignalR event handlers for:
 *    - New messages (update conversation list)
 *    - User online/offline status
 *    - Message status updates
 * 4. Handle conversation selection and navigation
 * 5. Cleanup connections on unmount
 */
const MessagingContainer = () => {
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationMetadata | null>(null);
  const [conversations, setConversations] = useState<ConversationMetadata[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const { user } = useUser();
  const { addUnreadMessage, setUserOnline, setUserOffline } = useMessaging();

  // Initialize SignalR and load conversations
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        // Initialize database
        await databaseService.initializeDatabase();

        // Load conversations from local storage
        const localConversations = await databaseService.getConversations();
        setConversations(localConversations);

        // Start SignalR connection
        if (!messagingSignalRService.IsConnected) {
          await messagingSignalRService.StartConnection();
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Failed to initialize messaging:", error);
        Alert.alert(
          "Connection Error",
          "Failed to initialize messaging. Please check your connection and try again.",
          [{ text: "OK" }]
        );
        setLoading(false);
      }
    };

    if (user.isAuthenticated) {
      initializeMessaging();
    }
  }, [user.isAuthenticated]);

  // Global SignalR event handlers
  useEffect(() => {
    const handleMessageReceived = useCallback(
      async (data: any) => {
        const { conversation, chatHistory } = data;

        try {
          // Update local database
          await databaseService.saveConversation(conversation);
          await databaseService.saveMessage(chatHistory);

          // Update conversation list
          const updatedConversations = await databaseService.getConversations();
          setConversations(updatedConversations);

          // Add unread message notification if not in current conversation
          if (
            !selectedConversation ||
            selectedConversation.id !== conversation.id
          ) {
            addUnreadMessage({
              conversationId: conversation.id,
              messageId: chatHistory.messageId,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error("❌ Failed to handle received message:", error);
        }
      },
      [selectedConversation, addUnreadMessage]
    );

    const handleUserOnline = useCallback(
      (userId: number) => {
        setUserOnline(userId);
        // Update conversation online status if it's the other participant
        setConversations((prev) =>
          prev.map((conv) => {
            const isOtherParticipant = conv.members.some(
              (member) => member.userId === userId
            );
            return isOtherParticipant ? { ...conv, isOnline: true } : conv;
          })
        );
      },
      [setUserOnline]
    );

    const handleUserOffline = useCallback(
      (data: any) => {
        const { userId, lastActive } = data;
        setUserOffline(userId, lastActive);
        // Update conversation online status
        setConversations((prev) =>
          prev.map((conv) => {
            const isOtherParticipant = conv.members.some(
              (member) => member.userId === userId
            );
            return isOtherParticipant ? { ...conv, isOnline: false } : conv;
          })
        );
      },
      [setUserOffline]
    );

    const handleConnectionFailed = useCallback(() => {
      Alert.alert(
        "Connection Failed",
        "Unable to connect to messaging service. You can still view offline messages.",
        [{ text: "OK" }]
      );
    }, []);

    // Register event handlers
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_MESSAGE_RECEIVED,
      handleMessageReceived
    );
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_USER_ONLINE,
      handleUserOnline
    );
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_USER_DISCONNECTED,
      handleUserOffline
    );
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_CONNECTION_FAILED,
      handleConnectionFailed
    );

    return () => {
      // Cleanup event handlers
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_MESSAGE_RECEIVED,
        handleMessageReceived
      );
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_USER_ONLINE,
        handleUserOnline
      );
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_USER_DISCONNECTED,
        handleUserOffline
      );
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_CONNECTION_FAILED,
        handleConnectionFailed
      );
    };
  }, [selectedConversation, addUnreadMessage, setUserOnline, setUserOffline]);

  const handleConversationSelect = useCallback(
    async (conversation: ConversationMetadata) => {
      setSelectedConversation(conversation);

      try {
        // Mark conversation as read
        const updatedConversation = {
          ...conversation,
          newMessageUnread: false,
        };
        await databaseService.saveConversation(updatedConversation);

        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversation.id ? updatedConversation : conv
          )
        );

        // Notify server of conversation check-in
        if (messagingSignalRService.IsConnected) {
          await messagingSignalRService.SendHubMethod(
            MESSAGING_EVENTS.CONVERSATION_CHECKIN,
            conversation.id
          );
        }
      } catch (error) {
        console.error("❌ Failed to check into conversation:", error);
      }
    },
    []
  );

  const handleConversationUpdate = useCallback(async () => {
    try {
      // Refresh conversation list when messages are sent
      const updatedConversations = await databaseService.getConversations();
      setConversations(updatedConversations);
    } catch (error) {
      console.error("❌ Failed to update conversations:", error);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.conversationListContainer}>
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          loading={loading}
          currentUserId={user.userId}
        />
      </View>

      <View style={styles.chatContainer}>
        {selectedConversation ? (
          <ChatContainer
            conversation={selectedConversation}
            onConversationUpdate={handleConversationUpdate}
            currentUser={user}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a conversation to start messaging
            </Text>
            <Text style={styles.emptyStateSubText}>
              Choose from your existing conversations or start a new one
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
  },
  conversationListContainer: {
    width: "35%",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    backgroundColor: "white",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});

export default MessagingContainer;
