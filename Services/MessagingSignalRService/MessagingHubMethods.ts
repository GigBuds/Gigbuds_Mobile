import { messagingSignalRService } from "./MessagingSignalRService";
import { ChatHistory } from "../../types/messaging.types";
import { MESSAGING_EVENTS } from "./handleMessagingCallbacks";

/**
 * COMPLETE SIGNALR HUB METHOD IMPLEMENTATIONS
 *
 * These methods correspond to server-side hub methods and should be called
 * to trigger real-time communication with other clients.
 */

export class MessagingHubMethods {
  /**
   * Send a message to a conversation
   * Hub Method: SendMessage
   *
   * Process:
   * 1. Invoke hub method with message data
   * 2. Server broadcasts to conversation participants
   * 3. Returns the saved message with server-generated data
   */
  static async sendMessage(
    message: Omit<ChatHistory, "messageId" | "timestamp">
  ): Promise<ChatHistory> {
    try {
      console.log("🚀 Sending message via SignalR:", message);

      const sentMessage = (await messagingSignalRService.InvokeHubMethod(
        MESSAGING_EVENTS.SEND_MESSAGE,
        message
      )) as ChatHistory;

      console.log("✅ Message sent successfully:", sentMessage);
      return sentMessage;
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   * Hub Method: SendTypingIndicator
   *
   * Parameters:
   * - conversationId: ID of the conversation
   * - isTyping: true when user starts typing, false when stops
   * - userName: Name of the user typing
   */
  static async sendTypingIndicator(
    conversationId: number,
    isTyping: boolean,
    userName: string
  ): Promise<void> {
    try {
      console.log(
        `🔄 Sending typing indicator: ${userName} ${
          isTyping ? "started" : "stopped"
        } typing in conversation ${conversationId}`
      );

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.SEND_TYPING_INDICATOR,
        conversationId,
        isTyping,
        userName
      );
    } catch (error) {
      console.error("❌ Failed to send typing indicator:", error);
      // Don't throw - typing indicators are not critical
    }
  }

  /**
   * Check into a conversation (notify server user is viewing this conversation)
   * Hub Method: OnConversationCheckin
   */
  static async conversationCheckin(conversationId: number): Promise<void> {
    try {
      console.log(`📱 Checking into conversation ${conversationId}`);

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.CONVERSATION_CHECKIN,
        conversationId
      );
    } catch (error) {
      console.error("❌ Failed to check into conversation:", error);
    }
  }

  /**
   * Check out of a conversation (notify server user left this conversation)
   * Hub Method: OnConversationCheckout
   */
  static async conversationCheckout(conversationId: number): Promise<void> {
    try {
      console.log(`📱 Checking out of conversation ${conversationId}`);

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.CONVERSATION_CHECKOUT,
        conversationId
      );
    } catch (error) {
      console.error("❌ Failed to check out of conversation:", error);
    }
  }

  /**
   * Edit an existing message
   * Hub Method: EditMessage
   */
  static async editMessage(
    messageId: string,
    conversationId: number,
    newContent: string
  ): Promise<void> {
    try {
      console.log(
        `✏️ Editing message ${messageId} in conversation ${conversationId}`
      );

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.EDIT_MESSAGE,
        messageId,
        conversationId,
        newContent
      );
    } catch (error) {
      console.error("❌ Failed to edit message:", error);
      throw error;
    }
  }

  /**
   * Delete a message
   * Hub Method: DeleteMessage
   */
  static async deleteMessage(
    messageId: string,
    conversationId: number
  ): Promise<void> {
    try {
      console.log(
        `🗑️ Deleting message ${messageId} in conversation ${conversationId}`
      );

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.DELETE_MESSAGE,
        messageId,
        conversationId
      );
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      throw error;
    }
  }

  /**
   * Get list of currently online users
   * Hub Method: GetOnlineUsers (Invoke - expects return value)
   */
  static async getOnlineUsers(): Promise<any[]> {
    try {
      console.log("👥 Fetching online users list");

      const onlineUsers = (await messagingSignalRService.InvokeHubMethod(
        MESSAGING_EVENTS.GET_ONLINE_USERS
      )) as any[];

      console.log(`✅ Found ${onlineUsers.length} online users:`, onlineUsers);
      return onlineUsers;
    } catch (error) {
      console.error("❌ Failed to get online users:", error);
      return [];
    }
  }

  /**
   * Join a conversation group (for group messaging features)
   * Hub Method: AddToConversation
   */
  static async joinConversationGroup(
    conversationId: number,
    userId: number
  ): Promise<void> {
    try {
      console.log(
        `🔗 Joining conversation group ${conversationId} for user ${userId}`
      );

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.ADD_TO_CONVERSATION,
        conversationId,
        userId
      );
    } catch (error) {
      console.error("❌ Failed to join conversation group:", error);
      throw error;
    }
  }

  /**
   * Leave a conversation group
   * Hub Method: RemoveFromConversation
   */
  static async leaveConversationGroup(
    conversationId: number,
    userId: number
  ): Promise<void> {
    try {
      console.log(
        `🔗 Leaving conversation group ${conversationId} for user ${userId}`
      );

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.REMOVE_FROM_CONVERSATION,
        conversationId,
        userId
      );
    } catch (error) {
      console.error("❌ Failed to leave conversation group:", error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * Hub Method: SendMessageRead
   */
  static async markMessagesAsRead(
    conversationId: number,
    messageIds: string[]
  ): Promise<void> {
    try {
      console.log(
        `👁️ Marking ${messageIds.length} messages as read in conversation ${conversationId}`
      );

      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.SEND_MESSAGE_READ,
        conversationId,
        messageIds
      );
    } catch (error) {
      console.error("❌ Failed to mark messages as read:", error);
      // Don't throw - read receipts are not critical
    }
  }
}
