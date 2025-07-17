import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { useMessaging } from "../../context/MessagingContext";
import { MessageBubble } from "./MessageBubble";
import { MessageInput, TypingIndicator } from "./MessageInput";

const ChatScreen = ({ conversationId, onBack }) => {
  const flatListRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullToLoadMore, setPullToLoadMore] = useState(false);
  const isLoadingMoreRef = useRef(false); // Track load more operations persistently

  // Message menu state
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Edit message state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const editFadeAnim = useRef(new Animated.Value(0)).current;

  const {
    messages,
    loadMessages,
    loadMoreMessages,
    editMessage,
    deleteMessage,
    messagesLoading,
    messagesError,
    messagesPagination,
    currentUser,
    conversations,
    typingUsers,
    isConnected,
    signalRService,
  } = useMessaging();

  const conversationMessages = messages[conversationId] || [];
  const isLoading = messagesLoading[conversationId] || false;
  const error = messagesError[conversationId];
  const conversation = conversations.find((c) => c?.id === conversationId);
  const pagination = messagesPagination[conversationId] || {
    hasMore: false,
    isLoadingMore: false,
  };

  // Ensure conversationMessages is always a valid array
  const validMessages = Array.isArray(conversationMessages)
    ? conversationMessages
    : [];

  // Handle conversation lifecycle - check in when entering, check out when leaving
  useEffect(() => {
    if (conversationId && currentUser && signalRService) {
      console.log(
        `🔄 ChatScreen: Checking in to conversation ${conversationId}`
      );

      // Check in to conversation (join SignalR group)
      signalRService.joinConversation(conversationId);

      // Load messages
      loadMessages(conversationId);

      // Cleanup function - check out when leaving conversation
      return () => {
        console.log(
          `🔄 ChatScreen: Checking out of conversation ${conversationId}`
        );
        signalRService.leaveConversation(conversationId);
      };
    }
  }, [conversationId, currentUser, signalRService]);

  // Auto-scroll to bottom when new messages arrive (only for new messages, not initial load)
  const previousMessageCountRef = useRef(0);
  useEffect(() => {
    const shouldPreventScroll =
      pullToLoadMore || pagination.isLoadingMore || isLoadingMoreRef.current;

    // Only auto-scroll when new messages are added (not initial load or loading more)
    if (
      validMessages.length > previousMessageCountRef.current &&
      previousMessageCountRef.current > 0 &&
      !shouldPreventScroll &&
      !isLoading
    ) {
      console.log("📜 AUTO-SCROLL: New message detected - scrolling to bottom");
      // Shorter delay for better responsiveness
      setTimeout(() => {
        scrollToNewest(true);
      }, 100);
    }

    previousMessageCountRef.current = validMessages.length;
  }, [
    validMessages.length,
    pullToLoadMore,
    pagination.isLoadingMore,
    isLoading,
  ]);

  // Initial scroll when entering a conversation (only once)
  useEffect(() => {
    if (conversationId && validMessages.length > 0 && !isLoading) {
      console.log(
        `🔄 Initial scroll to bottom for conversation ${conversationId}`
      );

      // Single scroll without animation for initial load
      setTimeout(() => {
        scrollToNewest(false);
      }, 100);
    }
  }, [conversationId, isLoading]); // Only trigger when conversation changes or loading finishes

  // Helper function to scroll to newest messages (at bottom)
  const scrollToNewest = (animated = true) => {
    if (flatListRef.current && validMessages.length > 0) {
      console.log(
        `📜 Scrolling to newest messages at bottom (${validMessages.length} messages, animated: ${animated})`
      );
      flatListRef.current.scrollToEnd({ animated });
    }
  };

  // Handle FlatList layout - only for initial render
  const handleFlatListLayout = () => {
    // Only scroll on initial layout, not on every re-render
    if (
      validMessages.length > 0 &&
      previousMessageCountRef.current === validMessages.length
    ) {
      console.log("📜 FlatList initial layout - scrolling to bottom");
      setTimeout(() => {
        scrollToNewest(false);
      }, 50);
    }
  };

  // Handle loading more messages when scrolling to top
  const handleLoadMore = async () => {
    if (!conversationId || !pagination.hasMore || pagination.isLoadingMore) {
      console.log(
        `⚠️ Skipping load more: hasMore=${pagination.hasMore}, isLoading=${pagination.isLoadingMore}`
      );
      return;
    }

    console.log(
      `📜 User scrolled to top, loading more messages for conversation ${conversationId}`
    );
    await loadMoreMessages(conversationId);
  };

  // Handle refresh (reload current messages)
  const handleRefresh = async () => {
    if (!conversationId || pullToLoadMore) return;

    setRefreshing(true);
    try {
      await loadMessages(conversationId, { refresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle pull-to-load-more (load older messages)
  const handlePullToLoadMore = async () => {
    if (
      !conversationId ||
      !pagination.hasMore ||
      pagination.isLoadingMore ||
      refreshing
    ) {
      return;
    }

    console.log(
      `📜 User pulled to load more messages for conversation ${conversationId}`
    );

    setPullToLoadMore(true);
    isLoadingMoreRef.current = true; // Set persistent flag
    try {
      await loadMoreMessages(conversationId);
    } finally {
      setPullToLoadMore(false);
      // Keep the ref flag true for a short period to prevent race conditions
      setTimeout(() => {
        isLoadingMoreRef.current = false;
        console.log(
          "🔓 Load more operation fully completed, auto-scroll re-enabled"
        );
      }, 1000); // 1 second delay
    }
  };

  // Handle message options menu
  const handleMessageOptions = (message) => {
    console.log(`📋 handleMessageOptions called with message:`, {
      messageId: message?.messageId,
      senderId: message?.senderId,
      currentUserId: currentUser?.id,
      content: message?.content,
    });

    const isOwnMessage =
      message?.senderId?.toString() === currentUser?.id?.toString();

    console.log(`🔍 Message ownership check:`, {
      senderId: message?.senderId?.toString(),
      currentUserId: currentUser?.id?.toString(),
      isOwnMessage,
    });

    if (isOwnMessage) {
      console.log(`✅ Showing message menu for message ${message?.messageId}`);
      setSelectedMessage(message);
      setShowMessageMenu(true);

      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      console.log(`❌ Not showing menu - not own message`);
    }
  };

  const hideMessageMenu = () => {
    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowMessageMenu(false);
      setSelectedMessage(null);
    });
  };

  // Handle edit message
  const handleEditMessage = (message) => {
    console.log(`✏️ handleEditMessage called with message:`, {
      messageId: message?.messageId,
      content: message?.content,
      conversationId,
    });

    hideMessageMenu();

    // Show custom edit modal instead of Alert.prompt
    setEditingMessage(message);
    setEditContent(message?.content || "");
    setShowEditModal(true);

    // Animate in
    Animated.timing(editFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideEditModal = () => {
    // Animate out
    Animated.timing(editFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowEditModal(false);
      setEditingMessage(null);
      setEditContent("");
    });
  };

  const saveEditedMessage = async () => {
    console.log(`💾 Save pressed with content: "${editContent}"`);

    if (!editContent || !editContent.trim()) {
      console.log("❌ Empty content, showing error");
      Alert.alert("Error", "Message content cannot be empty");
      return;
    }

    try {
      console.log(
        `🔄 Attempting to edit message ${
          editingMessage.messageId
        } with content: "${editContent.trim()}"`
      );

      await editMessage(
        editingMessage.messageId,
        conversationId,
        editContent.trim()
      );

      console.log(`✅ Message ${editingMessage.messageId} edited successfully`);

      hideEditModal();
    } catch (error) {
      console.error("❌ Failed to edit message:", error);
      Alert.alert(
        "Edit Failed",
        error.message || "Failed to edit message. Please try again."
      );
    }
  };

  // Handle delete message
  const handleDeleteMessage = (message) => {
    hideMessageMenu();

    // Small delay to let the menu close before showing the confirmation
    setTimeout(() => {
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteMessage(message.messageId, conversationId);
                console.log(
                  `✅ Message ${message.messageId} deleted successfully`
                );
              } catch (error) {
                console.error("❌ Failed to delete message:", error);
                Alert.alert(
                  "Delete Failed",
                  error.message || "Failed to delete message. Please try again."
                );
              }
            },
          },
        ]
      );
    }, 200);
  };

  // Group consecutive messages from the same sender
  const groupMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];

    const groups = [];
    let currentGroup = [];
    let lastSenderId = null;
    let lastTimestamp = null;

    for (const message of messages) {
      if (!message || !message.messageId) continue; // Skip invalid messages

      const timeDiff =
        lastTimestamp && message.timestamp
          ? (new Date(message.timestamp) - new Date(lastTimestamp)) /
            (1000 * 60)
          : 0;

      // Start new group if different sender or messages are more than 5 minutes apart
      if (message.senderId !== lastSenderId || timeDiff > 5) {
        if (currentGroup.length > 0) {
          groups.push({
            id: `group-${currentGroup[0].messageId}`,
            messages: [...currentGroup],
          });
        }
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }

      lastSenderId = message.senderId;
      lastTimestamp = message.timestamp;
    }

    if (currentGroup.length > 0) {
      groups.push({
        id: `group-${currentGroup[0].messageId}`,
        messages: [...currentGroup],
      });
    }

    return groups;
  };

  // Render message group
  const renderMessageGroup = ({ item: messageGroup, index }) => {
    // Handle both old array format and new object format
    const messages = messageGroup?.messages || messageGroup;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return null;
    }

    const firstMessage = messages[0];
    if (!firstMessage) return null;

    const isOwnMessage =
      firstMessage?.senderId?.toString() === currentUser?.id?.toString();

    return (
      <View style={styles.messageGroupContainer}>
        {messages.map((message, messageIndex) => {
          if (!message || !message.messageId) return null;

          const isLast = messageIndex === messages.length - 1;
          const showAvatar = !isOwnMessage && isLast;
          const showTimestamp = isLast;

          return (
            <MessageBubble
              key={message.messageId}
              message={message}
              currentUser={currentUser}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
              onLongPress={handleMessageOptions}
            />
          );
        })}
      </View>
    );
  };

  // Get conversation name for header
  const getConversationName = () => {
    if (!conversation || !currentUser) return "Chat";

    const members = conversation.members || [];

    // Handle array format: [{"userId": 1, "userName": "Test User"}, ...]
    if (Array.isArray(members)) {
      for (const member of members) {
        if (
          member?.userId &&
          member.userId.toString() !== currentUser?.id?.toString()
        ) {
          return member.userName || conversation.nameTwo || "Unknown";
        }
      }
    }
    // Handle object format: {"userId": "userName", ...} (legacy)
    else {
      const memberIds = Object.keys(members);
      for (const memberId of memberIds) {
        if (memberId !== currentUser?.id?.toString()) {
          return members[memberId] || conversation.nameTwo || "Unknown";
        }
      }
    }

    return conversation.nameOne || "Chat";
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ChatHeader
          title={getConversationName()}
          onBack={onBack}
          isConnected={isConnected}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load messages</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const messageGroups = useMemo(
    () => groupMessages(validMessages),
    [validMessages]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader
        title={getConversationName()}
        onBack={onBack}
        isConnected={isConnected}
        conversation={conversation}
      />

      <View style={styles.messagesContainer}>
        {isLoading && validMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messageGroups}
            renderItem={renderMessageGroup}
            keyExtractor={(item) =>
              item?.id || `group-${item?.messages?.[0]?.messageId || "unknown"}`
            }
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            removeClippedSubviews={true}
            windowSize={5}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={100}
            getItemLayout={null}
            legacyImplementation={false}
            refreshControl={
              <RefreshControl
                refreshing={pullToLoadMore}
                onRefresh={handlePullToLoadMore}
                enabled={pagination.hasMore}
                title={
                  pagination.hasMore
                    ? pullToLoadMore
                      ? "Loading older messages..."
                      : "Pull to load older messages"
                    : "No more messages"
                }
                tintColor="#007AFF"
                titleColor="#666666"
              />
            }
            onLayout={handleFlatListLayout}
            // onEndReached={handleLoadMore}  // Disabled automatic loading
            // onEndReachedThreshold={0.01}  // Disabled automatic loading
            // Traditional chat: oldest at top, newest at bottom
            contentContainerStyle={styles.messagesList}
            // maintainVisibleContentPosition={{
            //   minIndexForVisible: 0,
            //   autoscrollToTopThreshold: 10,
            // }}
            ListHeaderComponent={
              pagination.isLoadingMore && !pullToLoadMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadMoreText}>
                    Loading older messages...
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        <TypingIndicator
          typingUsers={typingUsers}
          conversationId={conversationId}
          currentUser={currentUser}
        />
      </View>

      <MessageInput
        conversationId={conversationId}
        disabled={!currentUser || !conversationId}
      />

      {/* Custom Message Menu Modal */}
      <Modal
        visible={showMessageMenu}
        transparent={true}
        animationType="none"
        onRequestClose={hideMessageMenu}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={hideMessageMenu}
          >
            <Animated.View
              style={[
                styles.messageMenu,
                {
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.menuTitle}>Message Options</Text>

              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  console.log(
                    `🎯 Edit button pressed for message ${selectedMessage?.messageId}`
                  );
                  handleEditMessage(selectedMessage);
                }}
              >
                <Text style={styles.menuOptionText}>✏️ Edit Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuOption, styles.deleteOption]}
                onPress={() => handleDeleteMessage(selectedMessage)}
              >
                <Text style={[styles.menuOptionText, styles.deleteOptionText]}>
                  🗑️ Delete Message
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuOption, styles.cancelOption]}
                onPress={hideMessageMenu}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* Custom Edit Message Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideEditModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: editFadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={hideEditModal}
          >
            <Animated.View
              style={[
                styles.editModal,
                {
                  transform: [
                    {
                      translateY: editFadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.editModalTitle}>Edit Message</Text>

              <TextInput
                style={styles.editTextInput}
                value={editContent}
                onChangeText={setEditContent}
                placeholder="Enter message content..."
                multiline={true}
                autoFocus={true}
                maxLength={500}
                placeholderTextColor="#999"
                accessibilityLabel="Edit message input"
              />

              {/* Divider */}
              <View style={styles.editModalDivider} />

              <View style={styles.editModalButtonsRow}>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.cancelButton]}
                  onPress={hideEditModal}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.saveButton]}
                  onPress={saveEditedMessage}
                  accessibilityRole="button"
                  accessibilityLabel="Save edited message"
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

// Chat Header Component
const ChatHeader = ({ title, onBack, isConnected, conversation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? "#4CAF50" : "#FF3B30" },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? "Online" : "Offline"}
          </Text>
          {conversation?.isOnline && (
            <Text style={styles.onlineText}>• Active now</Text>
          )}
        </View>
      </View>

      <View style={styles.headerRight}>
        {/* Could add call/video buttons here */}
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    backgroundColor: "#ffffff",
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#666666",
  },
  onlineText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 4,
  },
  headerRight: {
    width: 50, // Balance the back button
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  messagesList: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageGroupContainer: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
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
  loadMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
  },
  loadMoreButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loadMoreButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Message Menu Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  messageMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 8,
    marginHorizontal: 40,
    minWidth: 250,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    marginBottom: 4,
  },
  menuOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuOptionText: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
  },
  deleteOption: {
    // No additional border for delete option
  },
  deleteOptionText: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: "#f8f8f8",
  },
  cancelOptionText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    textAlign: "center",
  },
  // Edit Modal Styles
  editModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    alignSelf: "center",
    minWidth: 260,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    marginBottom: 18,
  },
  editTextInput: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#222",
    minHeight: 70,
    maxHeight: 120,
    textAlignVertical: "top",
    marginBottom: 18,
    backgroundColor: "#fafbfc",
  },
  editModalDivider: {
    height: 1,
    backgroundColor: "#ececec",
    marginBottom: 18,
    marginHorizontal: -24,
  },
  editModalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: "#f3f3f3",
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
});

export default ChatScreen;
