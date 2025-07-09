import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDraft } from "../../context/DraftContext";
import { useMessaging } from "../../context/MessagingContext";

import MessageItem from "./MessageItem";
import { ConversationMetadata, ChatHistory } from "../../types/messaging.types";
import { databaseService } from "../../Services/database/DatabaseService";
import { MessagingHubMethods } from "../../Services/MessagingSignalRService/MessagingHubMethods";
import {
  messagingSignalRService,
  MESSAGING_EVENTS,
} from "../../Services/MessagingSignalRService/MessagingSignalRService";

interface ChatContainerProps {
  conversation: ConversationMetadata;
  onConversationUpdate: () => void;
  currentUser: any;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  conversation,
  onConversationUpdate,
  currentUser,
}) => {
  const [messages, setMessages] = useState<ChatHistory[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { getDraft, setDraft, clearDraft } = useDraft();
  const { setTypingIndicator, getUsersTypingInConversation } = useMessaging();

  // Get other participant info
  const otherParticipant = conversation.members.find(
    (member) => member.userId !== currentUser.userId
  );
  const otherParticipantName = otherParticipant?.userName || "Unknown User";

  // Load conversation messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const localMessages = await databaseService.getMessages(
          conversation.id
        );
        setMessages(localMessages);
        setLoading(false);

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("❌ Failed to load messages:", error);
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversation.id]);

  // Load draft for this conversation
  useEffect(() => {
    const draft = getDraft(conversation.id);
    if (draft) {
      setInputText(draft);
    }
  }, [conversation.id, getDraft]);

  // SignalR event handlers for this conversation
  useEffect(() => {
    const handleMessageReceived = useCallback(
      async (data: any) => {
        const { conversation: updatedConversation, chatHistory } = data;

        if (updatedConversation.id === conversation.id) {
          // Add message to local state
          setMessages((prev) => [...prev, chatHistory]);

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      },
      [conversation.id]
    );

    const handleTypingIndicator = useCallback(
      (data: any) => {
        const { isTyping: typing, typerName, conversationId } = data;

        if (
          conversationId === conversation.id &&
          typerName !== currentUser.fullName
        ) {
          setTypingIndicator({
            conversationId,
            userName: typerName,
            isTyping: typing,
            timestamp: new Date(),
          });
        }
      },
      [conversation.id, currentUser.fullName, setTypingIndicator]
    );

    const handleMessageEdited = useCallback(
      async (data: any) => {
        const { messageId, conversationId, newContent } = data;

        if (conversationId === conversation.id) {
          // Update message in local database
          await databaseService.updateMessageContent(messageId, newContent);

          // Update local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === messageId
                ? { ...msg, content: newContent }
                : msg
            )
          );
        }
      },
      [conversation.id]
    );

    const handleMessageDeleted = useCallback(
      async (data: any) => {
        const { messageId, conversationId } = data;

        if (conversationId === conversation.id) {
          // Update message in local database
          await databaseService.deleteMessage(messageId);

          // Update local state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === messageId
                ? {
                    ...msg,
                    content: "This message was deleted",
                    isDeleted: true,
                  }
                : msg
            )
          );
        }
      },
      [conversation.id]
    );

    // Register event handlers
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_MESSAGE_RECEIVED,
      handleMessageReceived
    );
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_TYPING_INDICATOR_RECEIVED,
      handleTypingIndicator
    );
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_MESSAGE_EDITED,
      handleMessageEdited
    );
    messagingSignalRService.registerCallback(
      MESSAGING_EVENTS.ON_MESSAGE_DELETED,
      handleMessageDeleted
    );

    return () => {
      // Cleanup event handlers
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_MESSAGE_RECEIVED,
        handleMessageReceived
      );
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_TYPING_INDICATOR_RECEIVED,
        handleTypingIndicator
      );
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_MESSAGE_EDITED,
        handleMessageEdited
      );
      messagingSignalRService.removeCallback(
        MESSAGING_EVENTS.ON_MESSAGE_DELETED,
        handleMessageDeleted
      );
    };
  }, [conversation.id, currentUser.fullName]);

  // Handle input text changes and typing indicators
  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);

      // Save draft
      if (text.trim()) {
        setDraft(conversation.id, text);
      } else {
        clearDraft(conversation.id);
      }

      // Handle typing indicators
      if (text.trim() && !isTyping) {
        setIsTyping(true);
        MessagingHubMethods.sendTypingIndicator(
          conversation.id,
          true,
          currentUser.fullName || ""
        );
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          MessagingHubMethods.sendTypingIndicator(
            conversation.id,
            false,
            currentUser.fullName || ""
          );
        }
      }, 2000);
    },
    [conversation.id, currentUser.fullName, isTyping, setDraft, clearDraft]
  );

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    const messageContent = inputText.trim();
    setInputText("");
    setSending(true);

    // Clear draft
    clearDraft(conversation.id);

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      MessagingHubMethods.sendTypingIndicator(
        conversation.id,
        false,
        currentUser.fullName || ""
      );
    }

    try {
      // Create optimistic message for immediate UI update
      const optimisticMessage: ChatHistory = {
        messageId: `temp_${Date.now()}`,
        conversationId: conversation.id,
        senderId: currentUser.userId,
        senderName: currentUser.fullName || "",
        senderAvatar: currentUser.avatar || "",
        content: messageContent,
        timestamp: new Date(),
        deliveryStatus: "sending",
        readByNames: [],
        isDeleted: false,
      };

      // Add to UI immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Save to local database
      await databaseService.saveMessage(optimisticMessage);

      // Send via SignalR
      const sentMessage = await MessagingHubMethods.sendMessage({
        conversationId: conversation.id,
        senderId: currentUser.userId,
        senderName: currentUser.fullName || "",
        senderAvatar: currentUser.avatar || "",
        content: messageContent,
        deliveryStatus: "sending",
        readByNames: [],
        isDeleted: false,
      });

      // Replace optimistic message with server response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === optimisticMessage.messageId ? sentMessage : msg
        )
      );

      // Update database with server message
      await databaseService.saveMessage(sentMessage);

      // Update conversation list
      onConversationUpdate();
    } catch (error) {
      console.error("❌ Failed to send message:", error);

      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === `temp_${Date.now()}`
            ? { ...msg, deliveryStatus: "failed" as const }
            : msg
        )
      );

      Alert.alert(
        "Failed to Send",
        "Your message could not be sent. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSending(false);
    }
  }, [
    inputText,
    sending,
    conversation.id,
    currentUser,
    isTyping,
    clearDraft,
    onConversationUpdate,
  ]);

  // Get typing users for this conversation
  const typingUsers = getUsersTypingInConversation(conversation.id);
  const typingText =
    typingUsers.length > 0
      ? typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : `${typingUsers.length} people are typing...`
      : null;

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatHistory;
    index: number;
  }) => (
    <MessageItem
      message={item}
      isOwn={item.senderId === currentUser.userId}
      previousMessage={index > 0 ? messages[index - 1] : null}
      nextMessage={index < messages.length - 1 ? messages[index + 1] : null}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7345" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherParticipantName}</Text>
          {conversation.isOnline && (
            <Text style={styles.onlineStatus}>Online</Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="information-circle-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messageId}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Typing Indicator */}
      {typingText && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{typingText}</Text>
        </View>
      )}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  onlineStatus: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  typingText: {
    fontSize: 14,
    color: "#FF7345",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  sendButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF7345",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});

export default ChatContainer;
