import { databaseService } from "./DatabaseService";

/**
 * TEST SUITE FOR DATABASE SERVICE
 *
 * This test file verifies that the database service works correctly.
 * Run this to ensure the SQLite implementation is functioning properly.
 */

export const testDatabaseService = async () => {
  console.log("🧪 Starting Database Service Tests...");

  try {
    // Test 1: Initialize Database
    console.log("\n1. Testing database initialization...");
    await databaseService.initializeDatabase();
    console.log("✅ Database initialized successfully");

    // Test 2: Save a test conversation
    console.log("\n2. Testing conversation save...");
    const testConversation = {
      id: 1,
      nameOne: "John Doe",
      nameTwo: "Jane Smith",
      avatarOne: "https://example.com/john.jpg",
      avatarTwo: "https://example.com/jane.jpg",
      creatorId: 123,
      lastMessageSenderName: "John Doe",
      lastMessage: "Hello, how are you?",
      timestamp: new Date(),
      newMessageUnread: false,
      isOnline: true,
      members: [
        { userId: 123, userName: "John Doe" },
        { userId: 456, userName: "Jane Smith" },
      ],
      whosTyping: [],
    };

    await databaseService.saveConversation(testConversation);
    console.log("✅ Test conversation saved successfully");

    // Test 3: Retrieve conversations
    console.log("\n3. Testing conversation retrieval...");
    const conversations = await databaseService.getConversations();
    console.log(`✅ Retrieved ${conversations.length} conversations`);
    console.log("First conversation:", conversations[0]);

    // Test 4: Save a test message
    console.log("\n4. Testing message save...");
    const testMessage = {
      messageId: "msg_001",
      conversationId: 1,
      senderId: 123,
      senderName: "John Doe",
      senderAvatar: "https://example.com/john.jpg",
      content: "Hello, this is a test message!",
      timestamp: new Date(),
      deliveryStatus: "delivered",
      readByNames: [],
      isDeleted: false,
    };

    await databaseService.saveMessage(testMessage);
    console.log("✅ Test message saved successfully");

    // Test 5: Retrieve messages
    console.log("\n5. Testing message retrieval...");
    const messages = await databaseService.getMessages(1);
    console.log(`✅ Retrieved ${messages.length} messages for conversation 1`);
    console.log("First message:", messages[0]);

    // Test 6: Update message status
    console.log("\n6. Testing message status update...");
    await databaseService.updateMessageStatus("msg_001", "read");
    console.log("✅ Message status updated successfully");

    // Test 7: Get database stats
    console.log("\n7. Testing database statistics...");
    const stats = await databaseService.getStats();
    console.log("✅ Database stats:", stats);

    // Test 8: Search messages
    console.log("\n8. Testing message search...");
    const searchResults = await databaseService.searchMessages("test");
    console.log(`✅ Found ${searchResults.length} messages containing "test"`);

    console.log("\n🎉 All database tests passed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return false;
  }
};

// Usage example for the messaging app
export const databaseUsageExample = async () => {
  console.log("\n📚 Database Service Usage Example...");

  try {
    // Initialize database (do this once when app starts)
    await databaseService.initializeDatabase();

    // Example: Save a real conversation
    const conversation = {
      id: 2,
      nameOne: "Alice Johnson",
      nameTwo: "Bob Wilson",
      avatarOne: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alice",
      avatarTwo: "https://api.dicebear.com/6.x/avataaars/svg?seed=Bob",
      creatorId: 789,
      lastMessageSenderName: "Alice Johnson",
      lastMessage: "See you tomorrow!",
      timestamp: new Date(),
      newMessageUnread: true,
      isOnline: false,
      members: [
        { userId: 789, userName: "Alice Johnson" },
        { userId: 101, userName: "Bob Wilson" },
      ],
      whosTyping: [],
    };

    await databaseService.saveConversation(conversation);
    console.log("✅ Example conversation saved");

    // Example: Save multiple messages
    const messages = [
      {
        messageId: "msg_002",
        conversationId: 2,
        senderId: 789,
        senderName: "Alice Johnson",
        senderAvatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Alice",
        content: "Hey Bob, are we still meeting tomorrow?",
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        deliveryStatus: "read",
        readByNames: ["Bob Wilson"],
        isDeleted: false,
      },
      {
        messageId: "msg_003",
        conversationId: 2,
        senderId: 101,
        senderName: "Bob Wilson",
        senderAvatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Bob",
        content: "Yes, absolutely! Looking forward to it.",
        timestamp: new Date(Date.now() - 30000), // 30 seconds ago
        deliveryStatus: "delivered",
        readByNames: [],
        isDeleted: false,
      },
    ];

    for (const message of messages) {
      await databaseService.saveMessage(message);
    }
    console.log("✅ Example messages saved");

    // Example: Get all conversations with message counts
    const allConversations = await databaseService.getConversations();
    console.log("\n📋 All Conversations:");
    for (const conv of allConversations) {
      const messageCount = await databaseService.getMessageCount(conv.id);
      console.log(
        `- ${conv.nameOne} & ${conv.nameTwo}: ${messageCount} messages, Last: "${conv.lastMessage}"`
      );
    }

    console.log("\n✅ Database usage example completed successfully!");
  } catch (error) {
    console.error("❌ Database usage example failed:", error);
  }
};
