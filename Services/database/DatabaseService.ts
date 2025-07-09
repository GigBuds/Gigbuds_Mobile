import * as SQLite from "expo-sqlite";
import { ChatHistory, ConversationMetadata } from "../../types/messaging.types";

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    this.db = SQLite.openDatabaseSync("messaging.db");

    await this.createTables();
    console.log("🗄️ Database initialized successfully");
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    // Conversations table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY,
        nameOne TEXT NOT NULL,
        nameTwo TEXT NOT NULL,
        avatarOne TEXT,
        avatarTwo TEXT,
        creatorId INTEGER NOT NULL,
        lastMessageSenderName TEXT,
        lastMessage TEXT,
        timestamp INTEGER,
        newMessageUnread INTEGER DEFAULT 0,
        isOnline INTEGER DEFAULT 0,
        members TEXT,
        whosTyping TEXT
      );
    `);

    // Messages table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        messageId TEXT PRIMARY KEY,
        conversationId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        senderName TEXT NOT NULL,
        senderAvatar TEXT,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        deliveryStatus TEXT NOT NULL,
        readByNames TEXT,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY (conversationId) REFERENCES conversations (id)
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages (conversationId, timestamp DESC);
    `);

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_conversations_timestamp 
      ON conversations (timestamp DESC);
    `);
  }

  // Conversation CRUD operations
  async saveConversation(conversation: ConversationMetadata): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO conversations 
       (id, nameOne, nameTwo, avatarOne, avatarTwo, creatorId, 
        lastMessageSenderName, lastMessage, timestamp, newMessageUnread, 
        isOnline, members, whosTyping) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversation.id,
        conversation.nameOne,
        conversation.nameTwo,
        conversation.avatarOne || "",
        conversation.avatarTwo || "",
        conversation.creatorId,
        conversation.lastMessageSenderName || "",
        conversation.lastMessage || "",
        conversation.timestamp?.getTime() || null,
        conversation.newMessageUnread ? 1 : 0,
        conversation.isOnline ? 1 : 0,
        JSON.stringify(conversation.members || []),
        JSON.stringify(conversation.whosTyping || []),
      ]
    );
  }

  async getConversations(): Promise<ConversationMetadata[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const rows = await this.db.getAllAsync(
      "SELECT * FROM conversations ORDER BY timestamp DESC"
    );

    return rows.map((row: any) => ({
      id: row.id,
      nameOne: row.nameOne,
      nameTwo: row.nameTwo,
      avatarOne: row.avatarOne,
      avatarTwo: row.avatarTwo,
      creatorId: row.creatorId,
      lastMessageSenderName: row.lastMessageSenderName,
      lastMessage: row.lastMessage,
      timestamp: row.timestamp ? new Date(row.timestamp) : null,
      newMessageUnread: row.newMessageUnread === 1,
      isOnline: row.isOnline === 1,
      members: JSON.parse(row.members || "[]"),
      whosTyping: JSON.parse(row.whosTyping || "[]"),
    }));
  }

  async getConversationById(
    conversationId: number
  ): Promise<ConversationMetadata | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const row = await this.db.getFirstAsync(
      "SELECT * FROM conversations WHERE id = ?",
      [conversationId]
    );

    if (!row) {
      return null;
    }

    return {
      id: (row as any).id,
      nameOne: (row as any).nameOne,
      nameTwo: (row as any).nameTwo,
      avatarOne: (row as any).avatarOne,
      avatarTwo: (row as any).avatarTwo,
      creatorId: (row as any).creatorId,
      lastMessageSenderName: (row as any).lastMessageSenderName,
      lastMessage: (row as any).lastMessage,
      timestamp: (row as any).timestamp
        ? new Date((row as any).timestamp)
        : null,
      newMessageUnread: (row as any).newMessageUnread === 1,
      isOnline: (row as any).isOnline === 1,
      members: JSON.parse((row as any).members || "[]"),
      whosTyping: JSON.parse((row as any).whosTyping || "[]"),
    };
  }

  // Message CRUD operations
  async saveMessage(message: ChatHistory): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO messages 
       (messageId, conversationId, senderId, senderName, senderAvatar,
        content, timestamp, deliveryStatus, readByNames, isDeleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.messageId,
        message.conversationId,
        message.senderId,
        message.senderName,
        message.senderAvatar || "",
        message.content,
        message.timestamp?.getTime() || Date.now(),
        message.deliveryStatus,
        JSON.stringify(message.readByNames || []),
        message.isDeleted ? 1 : 0,
      ]
    );
  }

  async getMessages(
    conversationId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistory[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const rows = await this.db.getAllAsync(
      `SELECT * FROM messages 
       WHERE conversationId = ? 
       ORDER BY timestamp ASC 
       LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );

    return rows.map((row: any) => ({
      messageId: row.messageId,
      conversationId: row.conversationId,
      senderId: row.senderId,
      senderName: row.senderName,
      senderAvatar: row.senderAvatar,
      content: row.content,
      timestamp: new Date(row.timestamp),
      deliveryStatus: row.deliveryStatus,
      readByNames: JSON.parse(row.readByNames || "[]"),
      isDeleted: row.isDeleted === 1,
    }));
  }

  async updateMessageStatus(
    messageId: string,
    deliveryStatus: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.runAsync(
      "UPDATE messages SET deliveryStatus = ? WHERE messageId = ?",
      [deliveryStatus, messageId]
    );
  }

  async updateMessageContent(
    messageId: string,
    content: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.runAsync(
      "UPDATE messages SET content = ? WHERE messageId = ?",
      [content, messageId]
    );
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.runAsync(
      "UPDATE messages SET isDeleted = 1, content = ? WHERE messageId = ?",
      ["This message was deleted", messageId]
    );
  }

  async getLatestMessage(conversationId: number): Promise<ChatHistory | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const row = await this.db.getFirstAsync(
      `SELECT * FROM messages 
       WHERE conversationId = ? AND isDeleted = 0
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [conversationId]
    );

    if (!row) {
      return null;
    }

    return {
      messageId: (row as any).messageId,
      conversationId: (row as any).conversationId,
      senderId: (row as any).senderId,
      senderName: (row as any).senderName,
      senderAvatar: (row as any).senderAvatar,
      content: (row as any).content,
      timestamp: new Date((row as any).timestamp),
      deliveryStatus: (row as any).deliveryStatus,
      readByNames: JSON.parse((row as any).readByNames || "[]"),
      isDeleted: (row as any).isDeleted === 1,
    };
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.execAsync("DELETE FROM messages");
    await this.db.execAsync("DELETE FROM conversations");
  }
}

export const databaseService = new DatabaseService();
