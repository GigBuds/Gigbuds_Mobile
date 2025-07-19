import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Keyboard,
  Platform,
} from "react-native";
import { useMessaging } from "../../context/MessagingContext";

// Refactor MessageInput to use forwardRef
const MessageInput = forwardRef(
  (
    { conversationId, placeholder = "Nhập tin nhắn...", disabled = false },
    ref
  ) => {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const textInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Expose blur method to parent
    useImperativeHandle(ref, () => ({
      blur: () => {
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
      },
    }));

    const { sendMessage, startTyping, stopTyping, isConnected, currentUser } =
      useMessaging();

    // Keyboard handling
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        (e) => setKeyboardHeight(e.endCoordinates.height)
      );
      const keyboardDidHideListener = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => setKeyboardHeight(0)
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    // Handle text changes and typing indicators
    const handleTextChange = (text) => {
      setMessage(text);

      if (!conversationId || !isConnected) return;

      // Start typing indicator
      if (text.length > 0 && !isTyping) {
        setIsTyping(true);
        startTyping(conversationId);
      }

      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          stopTyping(conversationId);
        }
      }, 3000);

      // Stop typing immediately if message is empty
      if (text.length === 0 && isTyping) {
        setIsTyping(false);
        stopTyping(conversationId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    // Handle send message
    const handleSend = async () => {
      if (!message.trim() || !conversationId || disabled) return;

      const messageText = message.trim();

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        stopTyping(conversationId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      try {
        // Clear input immediately for better UX
        setMessage("");

        await sendMessage(conversationId, messageText);
      } catch (error) {
        console.error("Failed to send message:", error);
        // Restore message on error
        setMessage(messageText);
        // Could show error toast here
      }
    };

    // Cleanup typing on unmount
    useEffect(() => {
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (isTyping && conversationId) {
          stopTyping(conversationId);
        }
      };
    }, []);

    // More resilient send check - allow sending even if connection is temporarily down
    const canSend = message.trim().length > 0 && currentUser && !disabled;

    return (
      <View style={[styles.container, { marginBottom: keyboardHeight }]}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={message}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#999999"
            multiline={true}
            maxLength={1000}
            editable={!disabled}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.sendButtonText,
                canSend
                  ? styles.sendButtonTextActive
                  : styles.sendButtonTextDisabled,
              ]}
            >
              Gửi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection status indicator */}
        {!isConnected && currentUser && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Đang kết nối lại • Tin nhắn sẽ được gửi khi có kết nối
            </Text>
          </View>
        )}
      </View>
    );
  }
);

// Typing indicator component
const TypingIndicator = ({ typingUsers, conversationId, currentUser }) => {
  const typingInConversation = typingUsers[conversationId] || {};

  // Debug: Log typing data
  if (Object.keys(typingInConversation).length > 0) {
    console.log(
      `👀 TypingIndicator for conversation ${conversationId}:`,
      typingInConversation
    );
  }

  // Extract usernames from typing users - the structure is { userId: { userName, timestamp } }
  const typingUserNames = Object.values(typingInConversation)
    .filter((user) => {
      // Ensure user is valid and has a userName
      if (!user || typeof user !== "object") return false;
      const userName = user.userName || "";
      return userName && userName !== currentUser?.name;
    })
    .map((user) => {
      // Safely extract username from the {userName, timestamp} structure
      return String(user.userName || "").trim();
    })
    .filter((name) => name); // Remove empty names

  if (typingUserNames.length === 0) return null;

  const getTypingText = () => {
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} đang nhập...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} và ${typingUserNames[1]} đang nhập...`;
    } else {
      return `${typingUserNames.length} người đang nhập...`;
    }
  };

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDotsContainer}>
        <View style={[styles.typingDot, styles.dot1]} />
        <View style={[styles.typingDot, styles.dot2]} />
        <View style={[styles.typingDot, styles.dot3]} />
      </View>
      <Text style={styles.typingText}>{getTypingText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: "center",
    backgroundColor: "#f8f8f8",
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#007AFF",
  },
  sendButtonDisabled: {
    backgroundColor: "#e1e1e1",
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sendButtonTextActive: {
    color: "#ffffff",
  },
  sendButtonTextDisabled: {
    color: "#999999",
  },
  statusContainer: {
    backgroundColor: "#fff3cd",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#ffeaa7",
  },
  statusText: {
    fontSize: 12,
    color: "#856404",
    textAlign: "center",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
  },
  typingDotsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    color: "#666666",
    fontStyle: "italic",
  },
});

export { MessageInput, TypingIndicator };
export default MessageInput;
