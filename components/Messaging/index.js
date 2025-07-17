// Main container component
export { default as MessagingContainer } from "./MessagingContainer";

// Individual screen components
export { default as ConversationList } from "./ConversationList";
export { default as ChatScreen } from "./ChatScreen";

// Message components
export { default as MessageBubble, MessageBubbleGroup } from "./MessageBubble";
export { default as MessageInput, TypingIndicator } from "./MessageInput";

// Error handling
export { default as MessagingErrorBoundary } from "./ErrorBoundary";

// Re-export context for convenience
export { useMessaging } from "../../context/MessagingContext";
