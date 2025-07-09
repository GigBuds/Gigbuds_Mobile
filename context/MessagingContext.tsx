import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import asyncStorageService from "../Services/AsyncStorageService";

// ==================== MESSAGING STATE TYPES ====================

interface UnreadMessage {
  conversationId: number;
  messageId: string;
  timestamp: Date;
}

interface TypingIndicator {
  conversationId: number;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

interface MessagingState {
  unreadMessages: UnreadMessage[];
  onlineUsers: number[];
  typingIndicators: TypingIndicator[];
  isLoading: boolean;
  error: string | null;
}

// ==================== MESSAGING ACTIONS ====================

type MessagingAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_UNREAD_MESSAGE"; payload: UnreadMessage }
  | {
      type: "REMOVE_UNREAD_MESSAGE";
      payload: { conversationId: number; messageId?: string };
    }
  | { type: "CLEAR_UNREAD_MESSAGES"; payload: number } // conversationId
  | { type: "SET_USER_ONLINE"; payload: number }
  | { type: "SET_USER_OFFLINE"; payload: { userId: number; lastActive?: Date } }
  | { type: "SET_TYPING_INDICATOR"; payload: TypingIndicator }
  | {
      type: "REMOVE_TYPING_INDICATOR";
      payload: { conversationId: number; userName?: string };
    }
  | { type: "RESTORE_MESSAGING_STATE"; payload: Partial<MessagingState> };

// ==================== INITIAL STATE ====================

const initialState: MessagingState = {
  unreadMessages: [],
  onlineUsers: [],
  typingIndicators: [],
  isLoading: false,
  error: null,
};

// ==================== MESSAGING REDUCER ====================

function messagingReducer(
  state: MessagingState,
  action: MessagingAction
): MessagingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "ADD_UNREAD_MESSAGE":
      // Avoid duplicates
      const existingUnread = state.unreadMessages.find(
        (msg) =>
          msg.conversationId === action.payload.conversationId &&
          msg.messageId === action.payload.messageId
      );
      if (existingUnread) return state;

      return {
        ...state,
        unreadMessages: [...state.unreadMessages, action.payload],
      };

    case "REMOVE_UNREAD_MESSAGE":
      return {
        ...state,
        unreadMessages: state.unreadMessages.filter((msg) => {
          if (action.payload.messageId) {
            return !(
              msg.conversationId === action.payload.conversationId &&
              msg.messageId === action.payload.messageId
            );
          }
          return msg.conversationId !== action.payload.conversationId;
        }),
      };

    case "CLEAR_UNREAD_MESSAGES":
      return {
        ...state,
        unreadMessages: state.unreadMessages.filter(
          (msg) => msg.conversationId !== action.payload
        ),
      };

    case "SET_USER_ONLINE":
      const isAlreadyOnline = state.onlineUsers.includes(action.payload);
      if (isAlreadyOnline) return state;

      return {
        ...state,
        onlineUsers: [...state.onlineUsers, action.payload],
      };

    case "SET_USER_OFFLINE":
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(
          (userId) => userId !== action.payload.userId
        ),
      };

    case "SET_TYPING_INDICATOR":
      // Remove existing typing indicator for same user/conversation
      const filteredTyping = state.typingIndicators.filter(
        (indicator) =>
          !(
            indicator.conversationId === action.payload.conversationId &&
            indicator.userName === action.payload.userName
          )
      );

      // Add new typing indicator only if user is typing
      const newTypingIndicators = action.payload.isTyping
        ? [...filteredTyping, action.payload]
        : filteredTyping;

      return {
        ...state,
        typingIndicators: newTypingIndicators,
      };

    case "REMOVE_TYPING_INDICATOR":
      return {
        ...state,
        typingIndicators: state.typingIndicators.filter((indicator) => {
          if (action.payload.userName) {
            return !(
              indicator.conversationId === action.payload.conversationId &&
              indicator.userName === action.payload.userName
            );
          }
          return indicator.conversationId !== action.payload.conversationId;
        }),
      };

    case "RESTORE_MESSAGING_STATE":
      return {
        ...state,
        ...action.payload,
        // Convert timestamp strings back to Date objects
        unreadMessages:
          action.payload.unreadMessages?.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })) || state.unreadMessages,
        typingIndicators:
          action.payload.typingIndicators?.map((indicator) => ({
            ...indicator,
            timestamp: new Date(indicator.timestamp),
          })) || state.typingIndicators,
      };

    default:
      return state;
  }
}

// ==================== CONTEXT TYPES ====================

interface MessagingContextType {
  messaging: MessagingState;
  addUnreadMessage: (message: UnreadMessage) => void;
  removeUnreadMessage: (conversationId: number, messageId?: string) => void;
  clearUnreadMessages: (conversationId: number) => void;
  setUserOnline: (userId: number) => void;
  setUserOffline: (userId: number, lastActive?: Date) => void;
  setTypingIndicator: (indicator: TypingIndicator) => void;
  removeTypingIndicator: (conversationId: number, userName?: string) => void;
  getUnreadCount: (conversationId?: number) => number;
  isUserOnline: (userId: number) => boolean;
  getUsersTypingInConversation: (conversationId: number) => string[];
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

// ==================== CONTEXT CREATION ====================

const MessagingContext = createContext<MessagingContextType | undefined>(
  undefined
);

// ==================== MESSAGING PROVIDER ====================

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({
  children,
}) => {
  const [messaging, dispatch] = useReducer(messagingReducer, initialState);

  // Load messaging metadata from AsyncStorage on mount
  useEffect(() => {
    const loadMessagingFromStorage = async () => {
      try {
        const savedMessaging = await asyncStorageService.getMessagingMetadata();
        if (savedMessaging) {
          console.log(
            "💬 MessagingContext: Restored messaging metadata from AsyncStorage"
          );
          dispatch({
            type: "RESTORE_MESSAGING_STATE",
            payload: savedMessaging,
          });
        }
      } catch (error) {
        console.error(
          "❌ MessagingContext: Failed to load messaging metadata:",
          error
        );
      }
    };

    loadMessagingFromStorage();
  }, []);

  // Save messaging metadata to AsyncStorage (only unread messages - others are transient)
  useEffect(() => {
    const saveMessagingToStorage = async () => {
      try {
        const dataToSave = {
          unreadMessages: messaging.unreadMessages,
          // Don't persist online users or typing indicators (transient state)
        };
        await asyncStorageService.setMessagingMetadata(dataToSave);
        console.log(
          "💾 MessagingContext: Saved messaging metadata to AsyncStorage"
        );
      } catch (error) {
        console.error(
          "❌ MessagingContext: Failed to save messaging metadata:",
          error
        );
      }
    };

    // Only save if we have unread messages (avoid saving empty state repeatedly)
    if (messaging.unreadMessages.length > 0) {
      saveMessagingToStorage();
    }
  }, [messaging.unreadMessages]);

  // ==================== MESSAGING ACTIONS ====================

  const addUnreadMessage = (message: UnreadMessage) => {
    dispatch({ type: "ADD_UNREAD_MESSAGE", payload: message });
    console.log(
      `📨 MessagingContext: Added unread message for conversation ${message.conversationId}`
    );
  };

  const removeUnreadMessage = (conversationId: number, messageId?: string) => {
    dispatch({
      type: "REMOVE_UNREAD_MESSAGE",
      payload: { conversationId, messageId },
    });
    console.log(
      `✅ MessagingContext: Removed unread message for conversation ${conversationId}`
    );
  };

  const clearUnreadMessages = (conversationId: number) => {
    dispatch({ type: "CLEAR_UNREAD_MESSAGES", payload: conversationId });
    console.log(
      `🧹 MessagingContext: Cleared all unread messages for conversation ${conversationId}`
    );
  };

  const setUserOnline = (userId: number) => {
    dispatch({ type: "SET_USER_ONLINE", payload: userId });
    console.log(`🟢 MessagingContext: User ${userId} is now online`);
  };

  const setUserOffline = (userId: number, lastActive?: Date) => {
    dispatch({ type: "SET_USER_OFFLINE", payload: { userId, lastActive } });
    console.log(`🔴 MessagingContext: User ${userId} is now offline`);
  };

  const setTypingIndicator = (indicator: TypingIndicator) => {
    dispatch({ type: "SET_TYPING_INDICATOR", payload: indicator });
    console.log(
      `⌨️ MessagingContext: ${indicator.userName} ${
        indicator.isTyping ? "started" : "stopped"
      } typing`
    );
  };

  const removeTypingIndicator = (conversationId: number, userName?: string) => {
    dispatch({
      type: "REMOVE_TYPING_INDICATOR",
      payload: { conversationId, userName },
    });
    console.log(
      `🛑 MessagingContext: Removed typing indicator for conversation ${conversationId}`
    );
  };

  const setError = (error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  // ==================== UTILITY FUNCTIONS ====================

  const getUnreadCount = (conversationId?: number): number => {
    if (conversationId) {
      return messaging.unreadMessages.filter(
        (msg) => msg.conversationId === conversationId
      ).length;
    }
    return messaging.unreadMessages.length;
  };

  const isUserOnline = (userId: number): boolean => {
    return messaging.onlineUsers.includes(userId);
  };

  const getUsersTypingInConversation = (conversationId: number): string[] => {
    return messaging.typingIndicators
      .filter(
        (indicator) =>
          indicator.conversationId === conversationId && indicator.isTyping
      )
      .map((indicator) => indicator.userName);
  };

  // ==================== CONTEXT VALUE ====================

  const contextValue: MessagingContextType = {
    messaging,
    addUnreadMessage,
    removeUnreadMessage,
    clearUnreadMessages,
    setUserOnline,
    setUserOffline,
    setTypingIndicator,
    removeTypingIndicator,
    getUnreadCount,
    isUserOnline,
    getUsersTypingInConversation,
    setError,
    setLoading,
  };

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
};

export default MessagingContext;
