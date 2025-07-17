import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import { InteractionManager, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { databaseService } from "../Services/DatabaseService/DatabaseService.js";
import { apiService } from "../Services/MessagingService/ApiService.js";
import { signalRService } from "../Services/MessagingService/SignalRService.js";

/**
 * MESSAGING CONTEXT
 *
 * This is the main orchestrator for the messaging system that integrates:
 * - Database Service (offline storage)
 * - API Service (HTTP endpoints)
 * - SignalR Service (real-time messaging)
 *
 * Provides centralized state management and high-level operations for:
 * - Conversation management
 * - Message sending/receiving
 * - Real-time events
 * - Offline/online synchronization
 * - Connection management
 */

// ==================== CONTEXT CREATION ====================

const MessagingContext = createContext(null);

// ==================== INITIAL STATE ====================

const initialState = {
  // Connection state
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  // User state
  currentUser: null,
  isAuthenticated: false,

  // Conversations state
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  selectedConversationId: null,

  // Messages state
  messages: {},
  messagesLoading: {},
  messagesError: {},
  messagesPagination: {}, // Track pagination state per conversation

  // Real-time state
  typingUsers: {},
  onlineUsers: {},

  // Sync state
  isSyncing: false,
  lastSyncTime: null,
  pendingMessages: [],

  // UI state
  isInitialized: false,
  notifications: [],
};

// ==================== ACTION TYPES ====================

const ActionTypes = {
  // Connection actions
  CONNECTION_START: "CONNECTION_START",
  CONNECTION_SUCCESS: "CONNECTION_SUCCESS",
  CONNECTION_ERROR: "CONNECTION_ERROR",
  CONNECTION_LOST: "CONNECTION_LOST",

  // User actions
  SET_USER: "SET_USER",
  CLEAR_USER: "CLEAR_USER",

  // Conversation actions
  CONVERSATIONS_LOADING: "CONVERSATIONS_LOADING",
  CONVERSATIONS_SUCCESS: "CONVERSATIONS_SUCCESS",
  CONVERSATIONS_ERROR: "CONVERSATIONS_ERROR",
  CONVERSATION_ADDED: "CONVERSATION_ADDED",
  CONVERSATION_UPDATED: "CONVERSATION_UPDATED",
  CONVERSATION_SELECTED: "CONVERSATION_SELECTED",
  CONVERSATION_DELETED: "CONVERSATION_DELETED",

  // Message actions
  MESSAGES_LOADING: "MESSAGES_LOADING",
  MESSAGES_SUCCESS: "MESSAGES_SUCCESS",
  MESSAGES_ERROR: "MESSAGES_ERROR",
  MESSAGES_LOAD_MORE_START: "MESSAGES_LOAD_MORE_START",
  MESSAGES_LOAD_MORE_SUCCESS: "MESSAGES_LOAD_MORE_SUCCESS",
  MESSAGES_LOAD_MORE_ERROR: "MESSAGES_LOAD_MORE_ERROR",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  MESSAGE_UPDATED: "MESSAGE_UPDATED",
  MESSAGE_DELETED: "MESSAGE_DELETED",

  // Real-time actions
  USER_TYPING: "USER_TYPING",
  USER_STOPPED_TYPING: "USER_STOPPED_TYPING",
  USER_ONLINE_STATUS: "USER_ONLINE_STATUS",

  // Sync actions
  SYNC_START: "SYNC_START",
  SYNC_SUCCESS: "SYNC_SUCCESS",
  SYNC_ERROR: "SYNC_ERROR",

  // Notification actions
  ADD_NOTIFICATION: "ADD_NOTIFICATION",
  REMOVE_NOTIFICATION: "REMOVE_NOTIFICATION",

  // Initialization
  INITIALIZE_SUCCESS: "INITIALIZE_SUCCESS",
};

// ==================== REDUCER ====================

function messagingReducer(state, action) {
  switch (action.type) {
    // Connection cases
    case ActionTypes.CONNECTION_START:
      return {
        ...state,
        isConnecting: true,
        connectionError: null,
      };

    case ActionTypes.CONNECTION_SUCCESS:
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        connectionError: null,
      };

    case ActionTypes.CONNECTION_ERROR:
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        connectionError: action.payload.error,
      };

    case ActionTypes.CONNECTION_LOST:
      return {
        ...state,
        isConnected: false,
        connectionError: "Connection lost",
      };

    // User cases
    case ActionTypes.SET_USER:
      return {
        ...state,
        currentUser: action.payload.user,
        isAuthenticated: true,
      };

    case ActionTypes.CLEAR_USER:
      return {
        ...state,
        currentUser: null,
        isAuthenticated: false,
      };

    // Conversation cases
    case ActionTypes.CONVERSATIONS_LOADING:
      return {
        ...state,
        conversationsLoading: true,
        conversationsError: null,
      };

    case ActionTypes.CONVERSATIONS_SUCCESS:
      return {
        ...state,
        conversations: action.payload.conversations,
        conversationsLoading: false,
        conversationsError: null,
      };

    case ActionTypes.CONVERSATIONS_ERROR:
      return {
        ...state,
        conversationsLoading: false,
        conversationsError: action.payload.error,
      };

    case ActionTypes.CONVERSATION_ADDED:
      return {
        ...state,
        conversations: [action.payload.conversation, ...state.conversations],
      };

    case ActionTypes.CONVERSATION_UPDATED:
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.conversation.id
            ? { ...conv, ...action.payload.conversation }
            : conv
        ),
      };

    case ActionTypes.CONVERSATION_SELECTED:
      return {
        ...state,
        selectedConversationId: action.payload.conversationId,
      };

    case ActionTypes.CONVERSATION_DELETED:
      return {
        ...state,
        conversations: state.conversations.filter(
          (conv) => conv.id !== action.payload.conversationId
        ),
      };

    // Message cases
    case ActionTypes.MESSAGES_LOADING:
      return {
        ...state,
        messagesLoading: {
          ...state.messagesLoading,
          [action.payload.conversationId]: true,
        },
        messagesError: {
          ...state.messagesError,
          [action.payload.conversationId]: null,
        },
      };

    case ActionTypes.MESSAGES_SUCCESS:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
        messagesLoading: {
          ...state.messagesLoading,
          [action.payload.conversationId]: false,
        },
        messagesError: {
          ...state.messagesError,
          [action.payload.conversationId]: null,
        },
        messagesPagination: {
          ...state.messagesPagination,
          [action.payload.conversationId]: {
            currentPage: action.payload.pageIndex || 1,
            hasMore: action.payload.hasMore || false,
            isLoadingMore: false,
            totalCount: action.payload.totalCount || 0,
          },
        },
      };

    case ActionTypes.MESSAGES_ERROR:
      return {
        ...state,
        messagesLoading: {
          ...state.messagesLoading,
          [action.payload.conversationId]: false,
        },
        messagesError: {
          ...state.messagesError,
          [action.payload.conversationId]: action.payload.error,
        },
        messagesPagination: {
          ...state.messagesPagination,
          [action.payload.conversationId]: {
            ...state.messagesPagination[action.payload.conversationId],
            isLoadingMore: false,
          },
        },
      };

    // Load more messages cases
    case ActionTypes.MESSAGES_LOAD_MORE_START:
      return {
        ...state,
        messagesPagination: {
          ...state.messagesPagination,
          [action.payload.conversationId]: {
            ...state.messagesPagination[action.payload.conversationId],
            isLoadingMore: true,
          },
        },
      };

    case ActionTypes.MESSAGES_LOAD_MORE_SUCCESS: {
      const existingMessages =
        state.messages[action.payload.conversationId] || [];
      const olderMessages = action.payload.messages || [];

      console.log(
        `🔄 MESSAGES_LOAD_MORE_SUCCESS for conversation ${action.payload.conversationId}:`,
        {
          existingCount: existingMessages.length,
          newCount: olderMessages.length,
          existingFirst: existingMessages[0]?.messageId,
          existingLast:
            existingMessages[existingMessages.length - 1]?.messageId,
          newFirst: olderMessages[0]?.messageId,
          newLast: olderMessages[olderMessages.length - 1]?.messageId,
        }
      );

      // Filter out any duplicates before prepending
      const newMessages = olderMessages.filter(
        (newMsg) =>
          !existingMessages.some(
            (existingMsg) => existingMsg.messageId === newMsg.messageId
          )
      );

      // Prepend older messages to the beginning (they are older than existing messages)
      const finalMessages = [...newMessages, ...existingMessages];

      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: finalMessages,
        },
        messagesPagination: {
          ...state.messagesPagination,
          [action.payload.conversationId]: {
            currentPage: action.payload.pageIndex || 1,
            hasMore: action.payload.hasMore || false,
            isLoadingMore: false,
            totalCount: action.payload.totalCount || 0,
          },
        },
      };
    }

    case ActionTypes.MESSAGES_LOAD_MORE_ERROR:
      return {
        ...state,
        messagesPagination: {
          ...state.messagesPagination,
          [action.payload.conversationId]: {
            ...state.messagesPagination[action.payload.conversationId],
            isLoadingMore: false,
          },
        },
      };

    case ActionTypes.MESSAGE_RECEIVED: {
      const { message: newMessage } = action.payload;
      const { conversationId } = newMessage;
      const existingMessages = state.messages[conversationId] || [];

      // Remove temp message if this is a real messageId (not temp_)
      let filteredMessages = existingMessages;
      if (
        typeof newMessage.messageId === "string" &&
        !newMessage.messageId.startsWith("temp_")
      ) {
        filteredMessages = existingMessages.filter((msg) => {
          if (
            typeof msg.messageId === "string" &&
            msg.messageId.startsWith("temp_")
          ) {
            // Match on senderId, content, and timestamp proximity (within 5s)
            const timeDiff = Math.abs(
              new Date(newMessage.timestamp).getTime() -
                new Date(msg.timestamp).getTime()
            );
            return !(
              msg.senderId === newMessage.senderId &&
              msg.content === newMessage.content &&
              timeDiff < 5000
            );
          }
          return true;
        });
      }

      // Find if the message already exists in the state
      const existingMessageIndex = filteredMessages.findIndex(
        (msg) => msg.messageId === newMessage.messageId
      );

      let updatedMessages;

      if (existingMessageIndex > -1) {
        // Message exists, update it
        updatedMessages = [...filteredMessages];
        const currentMessage = updatedMessages[existingMessageIndex];

        // Merge new message properties, but preserve local isDeleted status if true
        updatedMessages[existingMessageIndex] = {
          ...currentMessage, // Keep local state like isDeleted
          ...newMessage, // Overwrite with newer server state
          isDeleted: currentMessage.isDeleted || newMessage.isDeleted, // Prioritize deletion
        };
      } else {
        // New message, add it to the list
        updatedMessages = [...filteredMessages, newMessage];
      }

      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
      };
    }

    case ActionTypes.MESSAGE_SENT:
      const sentConversationId = action.payload.message.conversationId;
      const sentMessages = state.messages[sentConversationId] || [];

      return {
        ...state,
        messages: {
          ...state.messages,
          [sentConversationId]: [...sentMessages, action.payload.message],
        },
        pendingMessages: state.pendingMessages.filter(
          (msg) => msg.tempId !== action.payload.tempId
        ),
      };

    case ActionTypes.MESSAGE_UPDATED: {
      const { messageId, conversationId, newContent } = action.payload;
      const existingMessages = state.messages[conversationId] || [];

      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: existingMessages.map((msg) =>
            msg.messageId === messageId
              ? { ...msg, content: newContent, isEdited: true }
              : msg
          ),
        },
      };
    }

    case ActionTypes.MESSAGE_DELETED: {
      const { messageId, conversationId } = action.payload;
      const existingMessages = state.messages[conversationId] || [];

      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: existingMessages.map((msg) =>
            msg.messageId === messageId
              ? { ...msg, isDeleted: true, content: "This message was deleted" }
              : msg
          ),
        },
      };
    }

    // Real-time cases
    case ActionTypes.USER_TYPING:
      console.log("🔄 USER_TYPING action:", action.payload);
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: {
            ...state.typingUsers[action.payload.conversationId],
            [action.payload.userId]: {
              userName: action.payload.userName,
              timestamp: Date.now(),
            },
          },
        },
      };

    case ActionTypes.USER_STOPPED_TYPING:
      console.log("🛑 USER_STOPPED_TYPING action:", action.payload);
      const typingConv = state.typingUsers[action.payload.conversationId] || {};
      const { [action.payload.userId]: removed, ...remainingTyping } =
        typingConv;

      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: remainingTyping,
        },
      };

    case ActionTypes.USER_ONLINE_STATUS:
      return {
        ...state,
        onlineUsers: {
          ...state.onlineUsers,
          [action.payload.userId]: {
            isOnline: action.payload.isOnline,
            lastSeen: action.payload.lastSeen || new Date(),
          },
        },
      };

    // Sync cases
    case ActionTypes.SYNC_START:
      return {
        ...state,
        isSyncing: true,
      };

    case ActionTypes.SYNC_SUCCESS:
      return {
        ...state,
        isSyncing: false,
        lastSyncTime: new Date(),
      };

    case ActionTypes.SYNC_ERROR:
      return {
        ...state,
        isSyncing: false,
      };

    // Notification cases
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            ...action.payload.notification,
            timestamp: new Date(),
          },
        ],
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload.notificationId
        ),
      };

    // Initialization
    case ActionTypes.INITIALIZE_SUCCESS:
      return {
        ...state,
        isInitialized: true,
      };

    default:
      return state;
  }
}

// ==================== CONTEXT CREATION ====================

// ==================== PROVIDER COMPONENT ====================

export const MessagingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messagingReducer, initialState);
  const typingTimeouts = useRef({});
  const initializationPromise = useRef(null);

  // ==================== INITIALIZATION ====================

  const initialize = async () => {
    if (initializationPromise.current) {
      return initializationPromise.current;
    }

    initializationPromise.current = (async () => {
      try {
        console.log("🚀 Initializing MessagingContext...");

        // Initialize database with retry logic
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await databaseService.initializeDatabase();
            console.log("✅ Database initialized");
            break;
          } catch (dbError) {
            retryCount++;
            console.warn(
              `⚠️ Database init attempt ${retryCount} failed:`,
              dbError.message
            );
            if (retryCount >= maxRetries) {
              throw dbError;
            }
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Load user from storage
        const userName = await AsyncStorage.getItem("userName");
        const userId = await AsyncStorage.getItem("userId");

        console.log(
          "Retrieved from storage - userName:",
          userName,
          "userId:",
          userId
        );

        if (userName && userId) {
          const userData = {
            name: userName,
            id: parseInt(userId, 10), // Ensure ID is a number
          };
          console.log("✅ User data found:", userData);
          dispatch({ type: ActionTypes.SET_USER, payload: { user: userData } });
          console.log("✅ User loaded from storage");
        } else {
          console.log("⚠️ No user data found in AsyncStorage");
        }

        // Setup SignalR event handlers
        setupSignalREventHandlers();
        console.log("✅ SignalR event handlers setup");

        dispatch({ type: ActionTypes.INITIALIZE_SUCCESS });
        console.log("✅ MessagingContext initialized");

        return true;
      } catch (error) {
        console.error("❌ MessagingContext initialization failed:", error);
        throw error;
      }
    })();

    return initializationPromise.current;
  };

  // ==================== SIGNALR EVENT HANDLERS ====================

  const setupSignalREventHandlers = () => {
    // Message received - receives { conversation, chatHistory }
    signalRService.onMessageReceived = (data) => {
      console.log("📨 Real-time message received:", data);

      const { conversation, chatHistory } = data;

      // Save to database
      databaseService
        .saveMessage({
          messageId: chatHistory.messageId,
          conversationId: chatHistory.conversationId,
          senderId: chatHistory.senderId,
          senderName: chatHistory.senderName,
          content: chatHistory.content,
          timestamp: chatHistory.timestamp,
          deliveryStatus: 1, // Delivered
        })
        .catch((error) =>
          console.error("❌ Failed to save received message:", error)
        );

      // Update state on main thread
      InteractionManager.runAfterInteractions(() => {
        dispatch({
          type: ActionTypes.MESSAGE_RECEIVED,
          payload: { message: chatHistory, conversation },
        });
      });
    };

    // Typing indicator - receives { isTyping, typerName, conversationId }
    signalRService.onTypingChanged = (data) => {
      console.log("👀 Typing indicator received:", data);
      const { isTyping, typerName, conversationId } = data;

      if (isTyping) {
        InteractionManager.runAfterInteractions(() => {
          dispatch({
            type: ActionTypes.USER_TYPING,
            payload: {
              conversationId,
              userId: typerName, // Use typerName as unique key
              userName: typerName,
            },
          });
        });

        // Auto-clear typing after 3 seconds
        const key = `${conversationId}-${typerName}`;
        if (typingTimeouts.current[key]) {
          clearTimeout(typingTimeouts.current[key]);
        }

        typingTimeouts.current[key] = setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            dispatch({
              type: ActionTypes.USER_STOPPED_TYPING,
              payload: {
                conversationId,
                userId: typerName, // Use typerName as unique key
                userName: typerName,
              },
            });
          });
          delete typingTimeouts.current[key];
        }, 3000);
      } else {
        const key = `${conversationId}-${typerName}`;
        if (typingTimeouts.current[key]) {
          clearTimeout(typingTimeouts.current[key]);
          delete typingTimeouts.current[key];
        }

        InteractionManager.runAfterInteractions(() => {
          dispatch({
            type: ActionTypes.USER_STOPPED_TYPING,
            payload: {
              conversationId,
              userId: typerName, // Use typerName as unique key
              userName: typerName,
            },
          });
        });
      }
    };

    // User online - receives userId
    signalRService.onUserOnline = (userId) => {
      InteractionManager.runAfterInteractions(() => {
        dispatch({
          type: ActionTypes.USER_ONLINE_STATUS,
          payload: {
            userId,
            isOnline: true,
            lastSeen: null,
          },
        });
      });
    };

    // User disconnected - receives onlineUser object
    signalRService.onUserDisconnected = (onlineUser) => {
      InteractionManager.runAfterInteractions(() => {
        dispatch({
          type: ActionTypes.USER_ONLINE_STATUS,
          payload: {
            userId: onlineUser.userId,
            isOnline: false,
            lastSeen: new Date(onlineUser.lastActive),
          },
        });
      });
    };

    // Message edited - receives { messageId, conversationId, newContent }
    signalRService.onMessageEdited = (data) => {
      console.log("✏️ Message edited:", data);
      // Could update local message in state/database here
      dispatch({
        type: ActionTypes.MESSAGE_UPDATED,
        payload: data,
      });
    };

    // Message deleted - receives { messageId, conversationId }
    signalRService.onMessageDeleted = (data) => {
      console.log("🗑️ Message deleted:", data);
      // Could mark message as deleted in state/database here
      dispatch({
        type: ActionTypes.MESSAGE_DELETED,
        payload: data,
      });
    };

    // Connection state changes
    signalRService.setOnConnectionStateChanged((state) => {
      console.log("🔗 SignalR connection state:", state);
      InteractionManager.runAfterInteractions(() => {
        if (state === "Connected") {
          dispatch({ type: ActionTypes.CONNECTION_SUCCESS });
        } else if (state === "Disconnected") {
          dispatch({ type: ActionTypes.CONNECTION_LOST });
        }
      });
    });

    // Error handling
    signalRService.setOnError((message, error) => {
      console.error("❌ SignalR error:", message, error);
      dispatch({
        type: ActionTypes.CONNECTION_ERROR,
        payload: { error: message },
      });
    });
  };

  // ==================== CONNECTION MANAGEMENT ====================

  const connect = async () => {
    try {
      if (!state.isAuthenticated) {
        throw new Error("User must be authenticated to connect");
      }

      dispatch({ type: ActionTypes.CONNECTION_START });

      await signalRService.connect();

      // Explicitly dispatch connection success
      dispatch({ type: ActionTypes.CONNECTION_SUCCESS });

      // Join user to their conversations
      if (state.conversations.length > 0) {
        for (const conversation of state.conversations) {
          await signalRService.joinConversation(conversation.id);
        }
      }

      console.log("✅ MessagingContext connected and ready");
    } catch (error) {
      console.error("❌ Failed to connect:", error);
      dispatch({
        type: ActionTypes.CONNECTION_ERROR,
        payload: { error: error.message },
      });
    }
  };

  const disconnect = async () => {
    try {
      await signalRService.disconnect();
    } catch (error) {
      console.error("❌ Failed to disconnect:", error);
    }
  };

  // ==================== USER MANAGEMENT ====================

  // const setUser = async (user) => {
  //   try {
  //     // Save to storage
  //     await AsyncStorage.setItem("user", JSON.stringify(user));

  //     // Update state
  //     dispatch({ type: ActionTypes.SET_USER, payload: { user } });

  //     console.log("✅ User set:", user.id);

  //     // 🔥 CRITICAL FIX: Auto-load conversations on authentication
  //     // This removes the race condition with SignalR
  //     // This removes the race condition with SignalR
  //     setTimeout(() => {
  //       loadConversations().catch((error) => {
  //         console.warn("⚠️ Auto-load conversations failed:", error.message);
  //         // Don't throw - allow user to manually retry
  //       });
  //     }, 100); // Small delay to ensure state is updated
  //   } catch (error) {
  //     console.error("❌ Failed to set user:", error);
  //     throw error;
  //   }
  // };

  // const clearUser = async () => {
  //   try {
  //     // Disconnect first
  //     await disconnect();

  //     // Clear storage
  //     await AsyncStorage.removeItem("user");

  //     // Update state
  //     dispatch({ type: ActionTypes.CLEAR_USER });

  //     console.log("✅ User cleared");
  //   } catch (error) {
  //     console.error("❌ Failed to clear user:", error);
  //   }
  // };

  // ==================== CONVERSATION MANAGEMENT ====================

  const loadConversations = async (options = {}) => {
    try {
      if (!state.currentUser) {
        console.warn("⚠️ No authenticated user found");
        return;
      }

      dispatch({ type: ActionTypes.CONVERSATIONS_LOADING });
      console.log("📋 Loading conversations for user:", state.currentUser.id);

      // 🚀 OPTIMIZATION: Load from cache first (offline-first strategy)
      const localConversations = await databaseService.getConversations();

      if (localConversations.length > 0) {
        dispatch({
          type: ActionTypes.CONVERSATIONS_SUCCESS,
          payload: { conversations: localConversations },
        });
        console.log(
          `✅ Loaded ${localConversations.length} conversations from cache`
        );
        console.log("localConversations", localConversations);
      }

      // 🌐 Server sync with enhanced error handling
      try {
        const serverResult = await apiService.getConversationMetadata(
          state.currentUser.id,
          {
            pageSize: 20, // Optimize initial load
            ...options,
          }
        );

        // 💾 Cache server data
        for (const conversation of serverResult.data) {
          await databaseService.saveConversation(conversation);
        }

        dispatch({
          type: ActionTypes.CONVERSATIONS_SUCCESS,
          payload: { conversations: serverResult.data },
        });

        console.log(
          `✅ Synced ${serverResult.data.length} conversations from server`
        );
      } catch (apiError) {
        console.warn("⚠️ Server sync failed:", apiError.message);

        // 🧠 INTELLIGENT ERROR HANDLING
        if (localConversations.length === 0) {
          // No cached data - this is a real error
          throw new Error(`Failed to load conversations: ${apiError.message}`);
        } else {
          // We have cached data - just log the warning
          console.log("📱 Using cached conversations due to network issue");
        }
      }
    } catch (error) {
      console.error("❌ Failed to load conversations:", error);
      dispatch({
        type: ActionTypes.CONVERSATIONS_ERROR,
        payload: { error: error.message },
      });

      // 🔄 AUTO-RETRY logic for critical failures
      if (!error.message.includes("No authenticated user")) {
        console.log("🔄 Will retry conversation loading in 5 seconds...");
        setTimeout(() => {
          if (state.currentUser) {
            loadConversations(options);
          }
        }, 5000);
      }
    }
  };

  const createConversation = async (conversationData) => {
    try {
      console.log("🆕 Creating conversation...");

      // Create on server first
      const newConversation = await apiService.createConversation(
        conversationData
      );

      // Save to local database
      await databaseService.saveConversation(newConversation);

      // Update state
      dispatch({
        type: ActionTypes.CONVERSATION_ADDED,
        payload: { conversation: newConversation },
      });

      // Join the conversation via SignalR
      if (state.isConnected) {
        await signalRService.joinConversation(newConversation.id);
      }

      console.log(`✅ Created conversation ${newConversation.id}`);
      return newConversation;
    } catch (error) {
      console.error("❌ Failed to create conversation:", error);
      throw error;
    }
  };

  const selectConversation = (conversationId) => {
    dispatch({
      type: ActionTypes.CONVERSATION_SELECTED,
      payload: { conversationId },
    });
  };

  const deleteConversation = async (conversationId) => {
    try {
      console.log(`🗑️ Deleting conversation ${conversationId}...`);

      // Delete from local database
      await databaseService.deleteConversation(conversationId);

      // Remove from state
      dispatch({
        type: ActionTypes.CONVERSATION_DELETED,
        payload: { conversationId },
      });

      console.log(`✅ Conversation ${conversationId} deleted successfully`);
    } catch (error) {
      console.error(
        `❌ Failed to delete conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  };

  // ==================== MESSAGE MANAGEMENT ====================

  const loadMessages = async (conversationId, options = {}) => {
    try {
      dispatch({
        type: ActionTypes.MESSAGES_LOADING,
        payload: { conversationId },
      });

      console.log(`💬 Loading messages for conversation ${conversationId}...`);

      // Load from local database first
      const localMessages = await databaseService.getMessages(conversationId);

      if (localMessages.length > 0) {
        dispatch({
          type: ActionTypes.MESSAGES_SUCCESS,
          payload: {
            conversationId,
            messages: localMessages,
            pageIndex: 1,
            hasMore: true, // Will be updated from server response
            totalCount: localMessages.length,
          },
        });
        console.log(
          `✅ Loaded ${localMessages.length} messages from local database`
        );
      }

      // Then sync with server
      try {
        const serverOptions = {
          pageIndex: 1,
          pageSize: 10, // Load first 10 messages
          ...options,
        };

        const serverResult = await apiService.getConversationMessages(
          conversationId,
          serverOptions
        );

        // Save to local database
        for (const message of serverResult.data) {
          await databaseService.saveMessage(message);
        }

        // Reload from local database to get properly sorted messages
        const finalMessages = await databaseService.getMessages(conversationId);

        // Calculate if there are more messages to load
        const hasMore = serverResult.data.length === serverOptions.pageSize;

        dispatch({
          type: ActionTypes.MESSAGES_SUCCESS,
          payload: {
            conversationId,
            messages: finalMessages,
            pageIndex: serverOptions.pageIndex,
            hasMore,
            totalCount: serverResult.count,
          },
        });

        console.log(
          `✅ Synced ${serverResult.data.length} messages from server`
        );
      } catch (apiError) {
        console.warn(
          "⚠️ Failed to sync messages with server, using local data:",
          apiError.message
        );
        if (localMessages.length === 0) {
          throw apiError;
        }
      }
    } catch (error) {
      console.error(
        `❌ Failed to load messages for conversation ${conversationId}:`,
        error
      );
      dispatch({
        type: ActionTypes.MESSAGES_ERROR,
        payload: { conversationId, error: error.message },
      });
    }
  };

  const loadMoreMessages = async (conversationId) => {
    const pagination = state.messagesPagination[conversationId];

    // Don't load if already loading or no more messages
    if (!pagination || pagination.isLoadingMore || !pagination.hasMore) {
      console.log(
        `⚠️ Cannot load more messages for conversation ${conversationId}: loading=${pagination?.isLoadingMore}, hasMore=${pagination?.hasMore}`
      );
      return;
    }

    try {
      dispatch({
        type: ActionTypes.MESSAGES_LOAD_MORE_START,
        payload: { conversationId },
      });

      const nextPage = pagination.currentPage + 1;

      // API call to get older messages with pagination
      console.log(
        "📜 Loading more messages for conversation",
        conversationId,
        "page",
        nextPage
      );

      const result = await apiService.getConversationMessages(conversationId, {
        pageIndex: nextPage,
        pageSize: 10,
      });

      console.log("💬 Result:", result);

      if (result.data && result.data.length > 0) {
        // Save new messages to local database
        for (const message of result.data) {
          await databaseService.saveMessage(message);
        }

        dispatch({
          type: ActionTypes.MESSAGES_LOAD_MORE_SUCCESS,
          payload: {
            conversationId,
            messages: result.data,
            pageIndex: nextPage,
            hasMore: result.data.length === 10, // Has more if we got a full page
            totalCount: result.count,
          },
        });

        console.log(
          `✅ Loaded ${result.data.length} more messages from server (page ${nextPage})`
        );
      } else {
        // No more messages available
        dispatch({
          type: ActionTypes.MESSAGES_LOAD_MORE_SUCCESS,
          payload: {
            conversationId,
            messages: [],
            pageIndex: nextPage,
            hasMore: false, // No more messages
            totalCount: result.count || 0,
          },
        });

        console.log(
          `📭 No more messages available for conversation ${conversationId}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to load more messages for conversation ${conversationId}:`,
        error
      );
      dispatch({
        type: ActionTypes.MESSAGES_LOAD_MORE_ERROR,
        payload: { conversationId, error: error.message },
      });
    }
  };

  const sendMessage = async (conversationId, content, tempId = null) => {
    try {
      if (!content.trim()) {
        throw new Error("Message content cannot be empty");
      }

      const messageId = tempId || `temp_${Date.now()}`;
      const timestamp = new Date();

      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        messageId,
        conversationId: Number(conversationId),
        senderId: state.currentUser.id,
        senderName: state.currentUser.name,
        content: content.trim(),
        timestamp,
        deliveryStatus: 0, // Sending
        isDeleted: false,
        readByNames: [],
      };

      // Add to state immediately (optimistic update)
      dispatch({
        type: ActionTypes.MESSAGE_SENT,
        payload: { message: optimisticMessage, tempId: messageId },
      });

      // Save to local database
      await databaseService.saveMessage(optimisticMessage);

      // Send via SignalR if connected
      if (state.isConnected) {
        try {
          // Pass required metadata for ChatHistory structure
          const messageMetadata = {
            senderName: state.currentUser.name,
            senderAvatar:
              state.currentUser.avatar || "https://via.placeholder.com/50",
          };

          await signalRService.sendMessage(
            conversationId,
            content,
            messageMetadata
          );
          console.log(`✅ Message sent via SignalR: ${messageId}`);
        } catch (signalrError) {
          console.warn(
            "⚠️ SignalR send failed, will sync later:",
            signalrError.message
          );
          // Add to pending messages for later sync
          dispatch({
            type: ActionTypes.ADD_NOTIFICATION,
            payload: {
              notification: {
                type: "warning",
                message: "Message will be sent when connection is restored",
              },
            },
          });
        }
      } else {
        console.log("📤 Message queued for sending when connected");
        // Add to pending messages
        // This would be handled by a sync mechanism
      }

      return optimisticMessage;
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      throw error;
    }
  };

  // ==================== MESSAGE EDIT/DELETE ====================

  const editMessage = async (messageId, conversationId, newContent) => {
    try {
      if (!newContent.trim()) {
        throw new Error("Message content cannot be empty");
      }

      console.log(
        `✏️ Editing message ${messageId} in conversation ${conversationId}`
      );

      // Get the original message for optimistic update
      const conversationMessages = state.messages[conversationId] || [];
      const originalMessage = conversationMessages.find(
        (msg) => msg.messageId === messageId
      );

      if (!originalMessage) {
        throw new Error("Message not found");
      }

      // Check if user owns the message
      if (originalMessage.senderId !== state.currentUser.id) {
        throw new Error("You can only edit your own messages");
      }

      // Optimistic update - immediately update UI
      dispatch({
        type: ActionTypes.MESSAGE_UPDATED,
        payload: { messageId, conversationId, newContent: newContent.trim() },
      });

      // --- FIX: Ensure deliveryStatus is always a valid integer (0-3) ---
      let deliveryStatus = Number(originalMessage.deliveryStatus);
      if (![0, 1, 2, 3].includes(deliveryStatus)) {
        deliveryStatus = 1; // Default to Delivered
      }
      // ---------------------------------------------------------------

      // Prepare updated message data for API
      const updatedMessage = {
        ...originalMessage,
        content: newContent.trim(),
        isEdited: true,
        deliveryStatus, // Always valid
      };

      // Update via API
      await apiService.updateMessage(updatedMessage);

      // Update local database
      await databaseService.saveMessage(updatedMessage);

      // Send via SignalR if connected to notify other users
      if (state.isConnected) {
        try {
          await signalRService.editMessage(
            messageId,
            conversationId,
            newContent.trim()
          );
          console.log(`✅ Message edit sent via SignalR: ${messageId}`);
        } catch (signalrError) {
          console.warn("⚠️ SignalR edit failed:", signalrError.message);
        }
      }

      console.log(`✅ Message ${messageId} edited successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to edit message ${messageId}:`, error);

      // Revert optimistic update on error
      // You might want to keep the original content and show an error
      throw error;
    }
  };

  const deleteMessage = async (messageId, conversationId) => {
    try {
      console.log(
        `🗑️ Deleting message ${messageId} in conversation ${conversationId}`
      );

      // Get the original message
      const conversationMessages = state.messages[conversationId] || [];
      const originalMessage = conversationMessages.find(
        (msg) => msg.messageId === messageId
      );

      if (!originalMessage) {
        throw new Error("Message not found");
      }

      // Check if user owns the message
      if (originalMessage.senderId !== state.currentUser.id) {
        throw new Error("You can only delete your own messages");
      }

      // Optimistic update - immediately mark as deleted in UI
      dispatch({
        type: ActionTypes.MESSAGE_DELETED,
        payload: { messageId, conversationId },
      });

      // Delete via API
      await apiService.deleteMessage(messageId);

      // Update local database (mark as deleted)
      const deletedMessage = {
        ...originalMessage,
        isDeleted: true,
        content: "This message was deleted",
      };
      await databaseService.saveMessage(deletedMessage);

      // Send via SignalR if connected to notify other users
      if (state.isConnected) {
        try {
          await signalRService.deleteMessage(messageId, conversationId);
          console.log(`✅ Message deletion sent via SignalR: ${messageId}`);
        } catch (signalrError) {
          console.warn("⚠️ SignalR delete failed:", signalrError.message);
        }
      }

      console.log(`✅ Message ${messageId} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete message ${messageId}:`, error);

      // Revert optimistic update on error
      // You might want to restore the original message and show an error
      throw error;
    }
  };

  // ==================== REAL-TIME FEATURES ====================

  const startTyping = (conversationId) => {
    // Check both context state and SignalR service state
    const contextConnected = state.isConnected;
    const signalRConnected = signalRService?.isConnected() || false;
    const isReallyConnected = contextConnected && signalRConnected;

    console.log("🔍 Typing indicator check:", {
      conversationId,
      contextConnected,
      signalRConnected,
      isReallyConnected,
      currentUser: state.currentUser?.id,
      isAuthenticated: state.isAuthenticated,
    });

    if (!isReallyConnected) {
      console.warn("⚠️ Cannot send typing indicator: not connected", {
        contextConnected,
        signalRConnected,
        reason: !contextConnected
          ? "Context not connected"
          : "SignalR not connected",
      });
      return Promise.resolve(false);
    }

    // Make this non-blocking by not awaiting
    signalRService
      .startTyping(conversationId)
      .then(() => {
        console.log(
          `✅ Started typing indicator for conversation ${conversationId}`
        );
      })
      .catch((error) => {
        console.warn("⚠️ Failed to send typing indicator:", error.message);
      });

    return Promise.resolve(true);
  };

  const stopTyping = (conversationId) => {
    // Check both context state and SignalR service state
    const contextConnected = state.isConnected;
    const signalRConnected = signalRService?.isConnected() || false;
    const isReallyConnected = contextConnected && signalRConnected;

    if (!isReallyConnected) {
      console.warn("⚠️ Cannot stop typing indicator: not connected", {
        contextConnected,
        signalRConnected,
        reason: !contextConnected
          ? "Context not connected"
          : "SignalR not connected",
      });
      return Promise.resolve(false);
    }

    // Make this non-blocking by not awaiting
    signalRService
      .stopTyping(conversationId)
      .then(() => {
        console.log(
          `✅ Stopped typing indicator for conversation ${conversationId}`
        );
      })
      .catch((error) => {
        console.warn("⚠️ Failed to stop typing indicator:", error.message);
      });

    return Promise.resolve(true);
  };

  // ==================== SYNC MANAGEMENT ====================

  const syncWithServer = async () => {
    try {
      if (!state.currentUser || state.isSyncing) {
        return;
      }

      dispatch({ type: ActionTypes.SYNC_START });
      console.log("🔄 Starting sync with server...");

      // Sync conversations
      await loadConversations();

      // Sync messages for active conversations
      for (const conversation of state.conversations.slice(0, 5)) {
        // Limit to recent 5
        await loadMessages(conversation.id);
      }

      dispatch({ type: ActionTypes.SYNC_SUCCESS });
      console.log("✅ Sync completed");
    } catch (error) {
      console.error("❌ Sync failed:", error);
      dispatch({ type: ActionTypes.SYNC_ERROR });
    }
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    initialize();
  }, []);

  // Auto-connect when user is set (with debouncing)
  useEffect(() => {
    if (state.isAuthenticated && !state.isConnected && !state.isConnecting) {
      // Add small delay to prevent race conditions
      const connectTimer = setTimeout(() => {
        connect();
      }, 500);

      return () => clearTimeout(connectTimer);
    }
  }, [state.isAuthenticated]);

  // Auto-sync periodically (DISABLED)
  // useEffect(() => {
  //   if (state.isAuthenticated && state.isConnected) {
  //     const syncInterval = setInterval(syncWithServer, 30000); // Every 30 seconds
  //     return () => clearInterval(syncInterval);
  //   }
  // }, [state.isAuthenticated, state.isConnected]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      console.log("📱 App state changed:", nextAppState);

      if (nextAppState === "background" || nextAppState === "inactive") {
        // App is going to background - check out of all conversations
        console.log("🔄 App backgrounding - checking out of all conversations");

        if (signalRService && signalRService.isConnected()) {
          // Get all active conversations and check out
          const activeConversations = Array.from(
            signalRService.activeConversations || []
          );
          for (const conversationId of activeConversations) {
            try {
              await signalRService.leaveConversation(conversationId);
              console.log(`✅ Checked out of conversation ${conversationId}`);
            } catch (error) {
              console.warn(
                `⚠️ Failed to check out of conversation ${conversationId}:`,
                error.message
              );
            }
          }
        }
      } else if (nextAppState === "active") {
        // App is coming to foreground - reconnect if needed
        console.log("🔄 App foregrounding - ensuring connection");

        if (state.isAuthenticated && !state.isConnected) {
          console.log("🔄 Reconnecting to SignalR...");
          connect();
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [state.isAuthenticated, state.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🔄 MessagingContext cleanup starting...");

      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);

      // Check out of all active conversations before disconnecting
      if (signalRService && signalRService.isConnected()) {
        const activeConversations = Array.from(
          signalRService.activeConversations || []
        );
        console.log(
          `🔄 Checking out of ${activeConversations.length} active conversations...`
        );

        // Use Promise.all to checkout of all conversations in parallel
        Promise.all(
          activeConversations.map((conversationId) =>
            signalRService.leaveConversation(conversationId)
          )
        )
          .then(() => {
            console.log("✅ Checked out of all conversations");
          })
          .catch((error) => {
            console.warn(
              "⚠️ Error during conversation checkout:",
              error.message
            );
          });
      }

      // Only disconnect if actually connected to prevent race conditions
      if (state.isConnected) {
        console.log("🔌 Cleaning up active connection...");
        disconnect();
      } else {
        console.log("📱 No active connection to clean up");
      }
    };
  }, [state.isConnected]);

  // ==================== USER SEARCH ====================

  const searchUsers = async (query, pageIndex = 1, pageSize = 10) => {
    try {
      console.log(`🔍 Searching users for "${query}"...`);

      // Note: No reducer dispatch needed, this is a direct API call
      return apiService.searchUsers(query, pageIndex, pageSize);
    } catch (error) {
      console.error(`❌ Failed to search users for "${query}":`, error);
      throw error; // Re-throw to be handled by the UI
    }
  };

  // ==================== VALUE ====================

  const value = {
    // State
    ...state,

    // User management
    // setUser,
    // clearUser,

    // Connection management
    connect,
    disconnect,

    // Conversation management
    loadConversations,
    createConversation,
    selectConversation,
    deleteConversation,

    // Message management
    loadMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,

    // Real-time features
    startTyping,
    stopTyping,

    // Sync management
    syncWithServer,

    // Utilities
    initialize,

    // SignalR service (for direct access to conversation lifecycle)
    signalRService,

    // User search
    searchUsers,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
};

export default MessagingContext;
