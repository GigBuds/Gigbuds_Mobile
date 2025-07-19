import * as SQLite from "expo-sqlite";

/**
 * DATABASE SERVICE FOR MESSAGING SYSTEM
 *
 * This service handles all local SQLite operations for offline-first messaging:
 * - Conversations metadata storage and retrieval
 * - Messages storage with delivery status tracking
 * - Search and pagination functionality
 * - Database initialization and schema management
 *
 * Tables:
 * - conversations: Stores conversation metadata, participants, last message
 * - messages: Stores individual messages with delivery status and content
 */

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the database and create tables
   * This should be called once when the app starts
   */
  async initializeDatabase() {
    try {
      console.log("🗄️ Initializing messaging database...");

      // Close existing connection if any
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.warn(
            "⚠️ Error closing existing database:",
            closeError.message
          );
        }
        this.db = null;
      }

      // Use the modern expo-sqlite API with error handling
      try {
        this.db = await SQLite.openDatabaseAsync("messaging.db");

        // Test the connection immediately
        await this.db.getFirstAsync("SELECT 1 as test");
        console.log("✅ Database connection verified");

        await this.createTables();
        this.isInitialized = true;
        console.log("✅ Database initialized successfully");
      } catch (sqliteError) {
        console.error("❌ SQLite specific error:", sqliteError);

        // Fallback: try with different database name
        console.log("🔄 Attempting fallback database initialization...");
        this.db = await SQLite.openDatabaseAsync(`messaging_${Date.now()}.db`);
        await this.createTables();
        this.isInitialized = true;
        console.log("✅ Fallback database initialized successfully");
      }
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      this.isInitialized = false;
      this.db = null;
      throw error;
    }
  }

  /**
   * Create database tables with proper schema
   */
  async createTables() {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      console.log("📋 Creating database tables...");

      // Conversations table - stores conversation metadata
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

      // Messages table - stores individual messages
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

      console.log("✅ Database tables created successfully");
    } catch (error) {
      console.error("❌ Failed to create tables:", error);
      throw error;
    }
  }

  /**
   * Safely parse JSON with fallback value
   * @param {string} jsonString - JSON string to parse
   * @param {any} fallback - Fallback value if parsing fails
   * @returns {any} Parsed object or fallback
   */
  safeJSONParse(jsonString, fallback) {
    try {
      if (!jsonString) return fallback;
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn("⚠️ Failed to parse JSON, using fallback:", error.message);
      return fallback;
    }
  }

  /**
   * Check if database is ready for operations and re-initialize if needed
   */
  async checkInitialized() {
    if (!this.isInitialized || !this.db) {
      console.warn(
        "⚠️ Database not initialized, attempting to re-initialize..."
      );
      await this.initializeDatabase();
    }

    // Additional check to ensure database is still valid
    try {
      await this.db.getFirstAsync("SELECT 1");
    } catch (error) {
      console.warn(
        "⚠️ Database connection invalid, re-initializing...",
        error.message
      );
      this.isInitialized = false;
      this.db = null;
      await this.initializeDatabase();
    }
  }

  // ==================== CONVERSATION OPERATIONS ====================

  /**
   * Save or update a conversation
   * @param {Object} conversation - Conversation metadata object
   */
  async saveConversation(conversation) {
    await this.checkInitialized();

    try {
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
          conversation.timestamp?.getTime() || Date.now(),
          conversation.newMessageUnread ? 1 : 0,
          conversation.isOnline ? 1 : 0,
          JSON.stringify(conversation.members || []),
          JSON.stringify(conversation.whosTyping || []),
        ]
      );

      console.log(`✅ Conversation ${conversation.id} saved successfully`);
    } catch (error) {
      console.error(
        `❌ Failed to save conversation ${conversation.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all conversations sorted by last activity
   * @returns {Promise<Array>} Array of conversation objects
   */
  async getConversations() {
    await this.checkInitialized();

    try {
      const rows = await this.db.getAllAsync(
        "SELECT * FROM conversations ORDER BY timestamp DESC"
      );

      const conversations = rows.map((row) => ({
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
        members: this.safeJSONParse(row.members, {}),
        whosTyping: this.safeJSONParse(row.whosTyping, []),
      }));

      console.log(`✅ Retrieved ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error("❌ Failed to get conversations:", error);
      throw error;
    }
  }

  /**
   * Get a specific conversation by ID
   * @param {number} conversationId - ID of the conversation
   * @returns {Promise<Object|null>} Conversation object or null if not found
   */
  async getConversationById(conversationId) {
    await this.checkInitialized();

    try {
      const row = await this.db.getFirstAsync(
        "SELECT * FROM conversations WHERE id = ?",
        [conversationId]
      );

      if (!row) {
        return null;
      }

      const conversation = {
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
        members: this.safeJSONParse(row.members, {}),
        whosTyping: this.safeJSONParse(row.whosTyping, []),
      };

      console.log(`✅ Retrieved conversation ${conversationId}`);
      return conversation;
    } catch (error) {
      console.error(`❌ Failed to get conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a conversation and all its messages
   * @param {number} conversationId - ID of the conversation to delete
   */
  async deleteConversation(conversationId) {
    await this.checkInitialized();

    try {
      // Delete all messages in this conversation first
      await this.db.runAsync("DELETE FROM messages WHERE conversationId = ?", [
        conversationId,
      ]);

      // Delete the conversation
      await this.db.runAsync("DELETE FROM conversations WHERE id = ?", [
        conversationId,
      ]);

      console.log(
        `✅ Conversation ${conversationId} and all its messages deleted successfully`
      );
    } catch (error) {
      console.error(
        `❌ Failed to delete conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  }

  // ==================== MESSAGE OPERATIONS ====================

  /**
   * Save or update a message
   * @param {Object} message - Message object
   */
  async saveMessage(message) {
    await this.checkInitialized();

    try {
      // If this is a real messageId (not temp_), check for a temp message to replace
      if (
        typeof message.messageId === "string" &&
        !message.messageId.startsWith("temp_")
      ) {
        // Try to find a temp message with same conversationId, senderId, content, and timestamp (within 5s)
        const tempRows = await this.db.getAllAsync(
          `SELECT messageId, timestamp FROM messages WHERE conversationId = ? AND senderId = ? AND content = ? AND messageId LIKE 'temp_%'`,
          [message.conversationId, message.senderId, message.content]
        );
        for (const tempRow of tempRows) {
          // Optionally, check timestamp proximity (within 5s)
          const timeDiff = Math.abs(
            (message.timestamp?.getTime?.() ||
              new Date(message.timestamp).getTime()) - tempRow.timestamp
          );
          if (timeDiff < 5000) {
            // Delete the temp message
            await this.db.runAsync(`DELETE FROM messages WHERE messageId = ?`, [
              tempRow.messageId,
            ]);
            console.log(
              `🧹 Deleted temp message ${tempRow.messageId} in favor of real message ${message.messageId}`
            );
          }
        }
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

      console.log(`✅ Message ${message.messageId} saved successfully`);
    } catch (error) {
      console.error(`❌ Failed to save message ${message.messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation with pagination
   * @param {number} conversationId - ID of the conversation
   * @param {number} limit - Number of messages to retrieve (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Array>} Array of message objects
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    await this.checkInitialized();

    try {
      const rows = await this.db.getAllAsync(
        `SELECT * FROM messages 
         WHERE conversationId = ?
         ORDER BY timestamp ASC, messageId ASC 
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );

      const messages = rows.map((row) => ({
        messageId: row.messageId,
        conversationId: row.conversationId,
        senderId: row.senderId,
        senderName: row.senderName,
        senderAvatar: row.senderAvatar,
        content: row.content,
        timestamp: new Date(row.timestamp),
        deliveryStatus: row.deliveryStatus,
        readByNames: this.safeJSONParse(row.readByNames, []),
        isDeleted: row.isDeleted === 1,
      }));

      console.log(
        `✅ Retrieved ${messages.length} messages for conversation ${conversationId}`
      );
      return messages;
    } catch (error) {
      console.error(
        `❌ Failed to get messages for conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update message delivery status
   * @param {string} messageId - ID of the message
   * @param {string} deliveryStatus - New delivery status ('Sending', 'Delivered', 'Read', 'Failed')
   */
  async updateMessageStatus(messageId, deliveryStatus) {
    await this.checkInitialized();

    try {
      await this.db.runAsync(
        "UPDATE messages SET deliveryStatus = ? WHERE messageId = ?",
        [deliveryStatus, messageId]
      );

      console.log(
        `✅ Message ${messageId} status updated to: ${deliveryStatus}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to update message status for ${messageId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Mark a message as deleted (soft delete)
   * @param {string} messageId - ID of the message to delete
   */
  async deleteMessage(messageId) {
    await this.checkInitialized();

    try {
      await this.db.runAsync(
        "UPDATE messages SET isDeleted = 1, content = ? WHERE messageId = ?",
        ["This message was deleted", messageId]
      );

      console.log(`✅ Message ${messageId} marked as deleted`);
    } catch (error) {
      console.error(`❌ Failed to delete message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Search messages by content
   * @param {string} searchTerm - Text to search for
   * @param {number} conversationId - Optional: limit search to specific conversation
   * @returns {Promise<Array>} Array of matching messages
   */
  async searchMessages(searchTerm, conversationId = null) {
    await this.checkInitialized();

    try {
      const sql = conversationId
        ? "SELECT * FROM messages WHERE content LIKE ? AND conversationId = ? AND isDeleted = 0 ORDER BY timestamp DESC"
        : "SELECT * FROM messages WHERE content LIKE ? AND isDeleted = 0 ORDER BY timestamp DESC";

      const params = conversationId
        ? [`%${searchTerm}%`, conversationId]
        : [`%${searchTerm}%`];

      const rows = await this.db.getAllAsync(sql, params);

      const messages = rows.map((row) => ({
        messageId: row.messageId,
        conversationId: row.conversationId,
        senderId: row.senderId,
        senderName: row.senderName,
        senderAvatar: row.senderAvatar,
        content: row.content,
        timestamp: new Date(row.timestamp),
        deliveryStatus: row.deliveryStatus,
        readByNames: this.safeJSONParse(row.readByNames, []),
        isDeleted: row.isDeleted === 1,
      }));

      console.log(
        `✅ Found ${messages.length} messages matching "${searchTerm}"`
      );
      return messages;
    } catch (error) {
      console.error(`❌ Failed to search messages for "${searchTerm}":`, error);
      throw error;
    }
  }

  /**
   * Get message count for a conversation
   * @param {number} conversationId - ID of the conversation
   * @returns {Promise<number>} Number of messages in the conversation
   */
  async getMessageCount(conversationId) {
    await this.checkInitialized();

    try {
      const result = await this.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM messages WHERE conversationId = ? AND isDeleted = 0",
        [conversationId]
      );

      const count = result?.count || 0;
      console.log(`✅ Conversation ${conversationId} has ${count} messages`);
      return count;
    } catch (error) {
      console.error(
        `❌ Failed to get message count for conversation ${conversationId}:`,
        error
      );
      throw error;
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Clear all data (for testing or logout)
   */
  async clearAllData() {
    await this.checkInitialized();

    try {
      await this.db.execAsync("DELETE FROM messages");
      await this.db.execAsync("DELETE FROM conversations");
      console.log("🗑️ All messaging data cleared");
    } catch (error) {
      console.error("❌ Failed to clear data:", error);
      throw error;
    }
  }

  /**
   * Clear only test data while preserving real user conversations
   */
  async clearTestData() {
    await this.checkInitialized();

    try {
      // Delete conversations containing "Test User"
      await this.db.execAsync(`
        DELETE FROM conversations 
        WHERE nameOne LIKE '%Test User%' 
           OR nameTwo LIKE '%Test User%'
           OR nameOne = 'Test User' 
           OR nameTwo = 'Test User'
      `);

      // Delete messages from Test User
      await this.db.execAsync(`
        DELETE FROM messages 
        WHERE senderName LIKE '%Test User%' 
           OR senderName = 'Test User'
      `);

      // Delete orphaned messages (messages without conversations)
      await this.db.execAsync(`
        DELETE FROM messages 
        WHERE conversationId NOT IN (SELECT id FROM conversations)
      `);

      console.log("🧹 Test data cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear test data:", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    await this.checkInitialized();

    try {
      const conversationCount = await this.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM conversations"
      );

      const messageCount = await this.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM messages WHERE isDeleted = 0"
      );

      const unreadConversations = await this.db.getFirstAsync(
        "SELECT COUNT(*) as count FROM conversations WHERE newMessageUnread = 1"
      );

      const stats = {
        conversationCount: conversationCount?.count || 0,
        messageCount: messageCount?.count || 0,
        unreadConversations: unreadConversations?.count || 0,
      };

      console.log("📊 Database stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Failed to get database stats:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
