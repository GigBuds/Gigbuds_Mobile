// User and Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
}

// Conversation Metadata
export interface ConversationMetadata {
  id: number;
  nameOne: string; // First participant name
  nameTwo: string; // Second participant name
  avatarOne: string; // First participant avatar
  avatarTwo: string; // Second participant avatar
  creatorId: number; // Who initiated the conversation
  lastMessageSenderName: string;
  lastMessage: string;
  timestamp: Date | null; // Last activity timestamp
  whosTyping: ConversationMember[];
  members: ConversationMember[];
  newMessageUnread: boolean; // Has unread messages
  isOnline: boolean; // Other participant online status
}

export interface ConversationMember {
  userId: number;
  userName: string;
}

// Message Types
export interface ChatHistory {
  conversationId: number;
  messageId: string;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  readByNames: string[];
  timestamp: Date | null;
  deliveryStatus: "sending" | "delivered" | "read" | "failed";
  content: string;
  isDeleted?: boolean;
}

// Typing and Presence
export interface TypingIndicator {
  isTyping: boolean;
  typerNames: string[];
  conversationId: number;
}

export interface OnlineUser {
  userId: number;
  lastActive: number; // -1 means currently online
}

// Draft Management
export interface MessageDraft {
  conversationId: number;
  content: string;
  timestamp: Date;
}

// Redux State Types
export interface MessagingMetadataState {
  unreadMessages: UnreadMessage[];
  onlineUsers: OnlineUser[];
  typingIndicators: { [conversationId: number]: string[] };
}

export interface UnreadMessage {
  conversationId: number;
  messageId: string;
  timestamp: Date;
}

// API Response Types
export interface ApiConversationResponse {
  id: number;
  nameOne: string;
  nameTwo: string;
  avatarOne: string;
  avatarTwo: string;
  creatorId: number;
  lastMessageSenderName: string;
  lastMessage: string;
  timestamp: string | null;
  newMessageUnread: boolean;
  isOnline: boolean;
  members: ConversationMember[];
  whosTyping: ConversationMember[];
}

export interface ApiMessageResponse {
  conversationId: number;
  messageId: string;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  readByNames: string[];
  timestamp: string;
  deliveryStatus: "sending" | "delivered" | "read" | "failed";
  content: string;
  isDeleted: boolean;
}

// SignalR Event Types
export interface SignalRMessageReceived {
  conversation: ConversationMetadata;
  chatHistory: ChatHistory;
}

export interface SignalRTypingIndicator {
  isTyping: boolean;
  typerName: string;
  conversationId: number;
}

export interface SignalRMessageStatus {
  messageId: string;
  status: "delivered" | "read";
  conversationId: number;
}

export interface SignalRMessageEdited {
  messageId: string;
  conversationId: number;
  newContent: string;
}

export interface SignalRMessageDeleted {
  messageId: string;
  conversationId: number;
}
