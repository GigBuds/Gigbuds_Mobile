import { ChatHistory, ConversationMetadata } from "../../types/messaging.types";
import { MessagingSignalRService } from "./MessagingSignalRService";

export function handleMessagingCallbacks(service: MessagingSignalRService) {
  const connection = service.HubConnection;
  if (!connection) return;

  // Message received
  connection.on(
    "ReceiveMessageAsync",
    (conversation: ConversationMetadata, chatHistory: ChatHistory) => {
      console.log(
        "💬 MessagingSignalR: Received message",
        conversation,
        chatHistory
      );
      // Type conversions for React Native
      conversation.id = Number(conversation.id);
      conversation.timestamp = conversation.timestamp
        ? new Date(conversation.timestamp)
        : null;
      chatHistory.conversationId = Number(chatHistory.conversationId);
      chatHistory.senderId = Number(chatHistory.senderId);
      chatHistory.timestamp = chatHistory.timestamp
        ? new Date(chatHistory.timestamp)
        : null;

      service.triggerCallback("onMessageReceived", {
        conversation,
        chatHistory,
      });
    }
  );

  // Typing indicator
  connection.on(
    "ReceiveTypingIndicatorAsync",
    (isTyping: boolean, typerName: string, conversationId: number) => {
      console.log(
        "💬 MessagingSignalR: Received typing indicator",
        isTyping,
        typerName,
        conversationId
      );
      service.triggerCallback("onTypingIndicatorReceived", {
        isTyping,
        typerName,
        conversationId: Number(conversationId),
      });
    }
  );

  // Message status updates
  connection.on("ReceiveMessageStatusAsync", (data) => {
    console.log("💬 MessagingSignalR: Received message status", data);
    service.triggerCallback("onMessageStatusReceived", data);
  });

  // User online status
  connection.on("UserOnlineAsync", (userId: number) => {
    console.log("💬 MessagingSignalR: User online", userId);
    service.triggerCallback("onUserOnline", Number(userId));
  });

  // User disconnected
  connection.on("UserDisconnectedAsync", (onlineUser) => {
    console.log("💬 MessagingSignalR: User disconnected", onlineUser);
    service.triggerCallback("onUserDisconnected", onlineUser);
  });

  // Message edited
  connection.on(
    "MessageEditedAsync",
    (messageId: string, conversationId: number, newContent: string) => {
      console.log("💬 MessagingSignalR: Message edited", {
        messageId,
        conversationId,
        newContent,
      });
      service.triggerCallback("onMessageEdited", {
        messageId,
        conversationId: Number(conversationId),
        newContent,
      });
    }
  );

  // Message deleted
  connection.on(
    "MessageDeletedAsync",
    (messageId: string, conversationId: number) => {
      console.log("💬 MessagingSignalR: Message deleted", {
        messageId,
        conversationId,
      });
      service.triggerCallback("onMessageDeleted", {
        messageId,
        conversationId: Number(conversationId),
      });
    }
  );

  // Connection established successfully
  connection.on("OnConnectedAsync", (connectionInfo: any) => {
    console.log(
      "💬 MessagingSignalR: Connection info received",
      connectionInfo
    );
    service.triggerCallback("onConnectionInfo", connectionInfo);
  });
}

// Event constants for type safety
export const MESSAGING_EVENTS = {
  // Incoming events
  ON_MESSAGE_RECEIVED: "onMessageReceived",
  ON_TYPING_INDICATOR_RECEIVED: "onTypingIndicatorReceived",
  ON_MESSAGE_STATUS_RECEIVED: "onMessageStatusReceived",
  ON_USER_ONLINE: "onUserOnline",
  ON_USER_DISCONNECTED: "onUserDisconnected",
  ON_MESSAGE_EDITED: "onMessageEdited",
  ON_MESSAGE_DELETED: "onMessageDeleted",
  ON_CONNECTION_INFO: "onConnectionInfo",

  // Connection events
  ON_CONNECTED: "onConnected",
  ON_DISCONNECTED: "onDisconnected",
  ON_RECONNECTED: "onReconnected",
  ON_RECONNECTING: "onReconnecting",
  ON_CONNECTION_FAILED: "onConnectionFailed",
  ON_MAX_RECONNECT_ATTEMPTS_REACHED: "onMaxReconnectAttemptsReached",

  // Outgoing methods
  SEND_MESSAGE: "SendMessage",
  SEND_TYPING_INDICATOR: "SendTypingIndicator",
  EDIT_MESSAGE: "EditMessage",
  DELETE_MESSAGE: "DeleteMessage",
  CONVERSATION_CHECKIN: "OnConversationCheckin",
  CONVERSATION_CHECKOUT: "OnConversationCheckout",
  GET_ONLINE_USERS: "GetOnlineUsers",
  ADD_TO_CONVERSATION: "AddToConversation",
  REMOVE_FROM_CONVERSATION: "RemoveFromConversation",
  SEND_MESSAGE_READ: "SendMessageRead",
} as const;
