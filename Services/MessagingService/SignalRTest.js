import { signalRService } from "./SignalRService.js";

/**
 * SIGNALR SERVICE TESTING SUITE
 *
 * This file contains comprehensive tests for the real-time messaging SignalR service.
 * Use these tests to verify your SignalR hub endpoints are working correctly.
 *
 * Usage:
 * import { runSignalRTests } from './Services/MessagingService/SignalRTest.js';
 * await runSignalRTests(testUserId);
 */

export const SIGNALR_TEST_CONFIG = {
  // Test configuration
  TEST_USER_ID: 1,
  TEST_CONVERSATION_ID: 1,
  TEST_MESSAGE_CONTENT: "Test message from SignalR test suite",

  // Connection timeouts
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  MESSAGE_TIMEOUT: 5000, // 5 seconds
  TYPING_TIMEOUT: 3000, // 3 seconds

  // Test hub URL (will use default if not set)
  TEST_HUB_URL: null, // Set to override default hub URL
};

/**
 * Test result tracker
 */
class TestResultTracker {
  constructor() {
    this.results = [];
    this.eventCallbacks = new Map();
  }

  addResult(testName, success, data = null, error = null) {
    const result = {
      testName,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
      duration: null,
    };
    this.results.push(result);
    return result;
  }

  startTest(testName) {
    const startTime = Date.now();
    return {
      complete: (success, data = null, error = null) => {
        const result = this.addResult(testName, success, data, error);
        result.duration = Date.now() - startTime;
        return result;
      },
    };
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.success).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce(
      (sum, r) => sum + (r.duration || 0),
      0
    );

    return {
      total,
      passed,
      failed,
      totalDuration,
      successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
    };
  }

  clear() {
    this.results = [];
    this.eventCallbacks.clear();
  }
}

const testTracker = new TestResultTracker();

/**
 * Test SignalR connection establishment
 */
export async function testSignalRConnection(
  hubUrl = SIGNALR_TEST_CONFIG.TEST_HUB_URL
) {
  const test = testTracker.startTest("SignalR Connection");

  try {
    console.log("🧪 Testing SignalR connection...");

    // Test connection
    const connected = await signalRService.connect(hubUrl);

    if (!connected) {
      throw new Error("Failed to establish connection");
    }

    // Verify connection state
    const isConnected = signalRService.isConnected();
    if (!isConnected) {
      throw new Error("Connection established but isConnected() returns false");
    }

    const connectionState = signalRService.getConnectionState();
    console.log(`✅ SignalR connected with state: ${connectionState}`);

    return test.complete(true, {
      connected: true,
      connectionState,
      isConnected,
    });
  } catch (error) {
    console.error("❌ SignalR connection test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test SignalR disconnection
 */
export async function testSignalRDisconnection() {
  const test = testTracker.startTest("SignalR Disconnection");

  try {
    console.log("🧪 Testing SignalR disconnection...");

    // Disconnect
    await signalRService.disconnect();

    // Verify disconnection
    const isConnected = signalRService.isConnected();
    if (isConnected) {
      throw new Error("Disconnect called but isConnected() still returns true");
    }

    console.log("✅ SignalR disconnected successfully");

    return test.complete(true, {
      disconnected: true,
      isConnected: false,
    });
  } catch (error) {
    console.error("❌ SignalR disconnection test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test joining and leaving conversations
 */
export async function testConversationJoinLeave(
  conversationId = SIGNALR_TEST_CONFIG.TEST_CONVERSATION_ID
) {
  const test = testTracker.startTest("Conversation Join/Leave");

  try {
    console.log(
      `🧪 Testing conversation join/leave for conversation ${conversationId}...`
    );

    if (!signalRService.isConnected()) {
      throw new Error("SignalR not connected");
    }

    // Test joining conversation
    const joinResult = await signalRService.joinConversation(conversationId);
    if (!joinResult) {
      throw new Error("Failed to join conversation");
    }

    console.log(`✅ Joined conversation ${conversationId}`);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test leaving conversation
    const leaveResult = await signalRService.leaveConversation(conversationId);
    if (!leaveResult) {
      throw new Error("Failed to leave conversation");
    }

    console.log(`✅ Left conversation ${conversationId}`);

    return test.complete(true, {
      conversationId,
      joined: true,
      left: true,
    });
  } catch (error) {
    console.error("❌ Conversation join/leave test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test sending messages
 */
export async function testSendMessage(
  conversationId = SIGNALR_TEST_CONFIG.TEST_CONVERSATION_ID
) {
  const test = testTracker.startTest("Send Message");

  try {
    console.log(
      `🧪 Testing message sending to conversation ${conversationId}...`
    );

    if (!signalRService.isConnected()) {
      throw new Error("SignalR not connected");
    }

    // Join conversation first
    await signalRService.joinConversation(conversationId);

    // Send test message
    const messageContent = `${
      SIGNALR_TEST_CONFIG.TEST_MESSAGE_CONTENT
    } - ${new Date().toISOString()}`;
    const sendResult = await signalRService.sendMessage(
      conversationId,
      messageContent,
      {
        messageType: "test",
        source: "signalr-test-suite",
      }
    );

    if (!sendResult) {
      throw new Error("Failed to send message");
    }

    console.log(`✅ Message sent to conversation ${conversationId}`);

    return test.complete(true, {
      conversationId,
      messageContent,
      sent: true,
    });
  } catch (error) {
    console.error("❌ Send message test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test typing indicators
 */
export async function testTypingIndicators(
  conversationId = SIGNALR_TEST_CONFIG.TEST_CONVERSATION_ID
) {
  const test = testTracker.startTest("Typing Indicators");

  try {
    console.log(
      `🧪 Testing typing indicators for conversation ${conversationId}...`
    );

    if (!signalRService.isConnected()) {
      throw new Error("SignalR not connected");
    }

    // Join conversation first
    await signalRService.joinConversation(conversationId);

    // Start typing
    const startTypingResult = await signalRService.startTyping(conversationId);
    if (!startTypingResult) {
      throw new Error("Failed to start typing");
    }

    console.log(`✅ Started typing in conversation ${conversationId}`);

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Stop typing
    const stopTypingResult = await signalRService.stopTyping(conversationId);
    if (!stopTypingResult) {
      throw new Error("Failed to stop typing");
    }

    console.log(`✅ Stopped typing in conversation ${conversationId}`);

    return test.complete(true, {
      conversationId,
      startedTyping: true,
      stoppedTyping: true,
    });
  } catch (error) {
    console.error("❌ Typing indicators test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test online status updates
 */
export async function testOnlineStatus() {
  const test = testTracker.startTest("Online Status");

  try {
    console.log("🧪 Testing online status updates...");

    if (!signalRService.isConnected()) {
      throw new Error("SignalR not connected");
    }

    // Update to online
    const onlineResult = await signalRService.updateOnlineStatus(true);
    if (!onlineResult) {
      throw new Error("Failed to update online status to true");
    }

    console.log("✅ Updated status to online");

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update to offline
    const offlineResult = await signalRService.updateOnlineStatus(false);
    if (!offlineResult) {
      throw new Error("Failed to update online status to false");
    }

    console.log("✅ Updated status to offline");

    // Set back to online
    await signalRService.updateOnlineStatus(true);

    return test.complete(true, {
      onlineUpdate: true,
      offlineUpdate: true,
    });
  } catch (error) {
    console.error("❌ Online status test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test event handlers
 */
export async function testEventHandlers() {
  const test = testTracker.startTest("Event Handlers");

  try {
    console.log("🧪 Testing event handlers...");

    if (!signalRService.isConnected()) {
      throw new Error("SignalR not connected");
    }

    let eventsReceived = {
      connectionStateChanged: false,
      messageReceived: false,
      typingChanged: false,
      userOnlineStatusChanged: false,
      error: false,
    };

    // Set up event handlers
    signalRService.setOnConnectionStateChanged((data) => {
      console.log("📡 Connection state changed:", data);
      eventsReceived.connectionStateChanged = true;
    });

    signalRService.setOnMessageReceived((message) => {
      console.log("💬 Message received:", message);
      eventsReceived.messageReceived = true;
    });

    signalRService.setOnTypingChanged((data) => {
      console.log("✏️ Typing changed:", data);
      eventsReceived.typingChanged = true;
    });

    signalRService.setOnUserOnlineStatusChanged((data) => {
      console.log("🟢 User online status changed:", data);
      eventsReceived.userOnlineStatusChanged = true;
    });

    signalRService.setOnError((error) => {
      console.log("❌ Error received:", error);
      eventsReceived.error = true;
    });

    console.log("✅ Event handlers set up successfully");

    return test.complete(true, {
      handlersConfigured: true,
      eventTypes: Object.keys(eventsReceived),
    });
  } catch (error) {
    console.error("❌ Event handlers test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Test message status operations
 */
export async function testMessageStatus(messageId = 1) {
  const test = testTracker.startTest("Message Status");

  try {
    console.log(
      `🧪 Testing message status operations for message ${messageId}...`
    );

    if (!signalRService.isConnected()) {
      throw new Error("SignalR not connected");
    }

    // Mark message as read
    const readResult = await signalRService.markMessageAsRead(messageId);
    if (!readResult) {
      throw new Error("Failed to mark message as read");
    }

    console.log(`✅ Marked message ${messageId} as read`);

    return test.complete(true, {
      messageId,
      markedAsRead: true,
    });
  } catch (error) {
    console.error("❌ Message status test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Run comprehensive SignalR tests
 * @param {number} userId - User ID for testing (optional)
 * @returns {Promise<Object>} Complete test results
 */
export async function runSignalRTests(
  userId = SIGNALR_TEST_CONFIG.TEST_USER_ID
) {
  console.log("\n🚀 Starting comprehensive SignalR tests...");
  console.log(`👤 Test User ID: ${userId}`);

  testTracker.clear();
  const startTime = Date.now();

  // Test sequence
  const tests = [
    () => testSignalRConnection(),
    () => testEventHandlers(),
    () => testConversationJoinLeave(),
    () => testSendMessage(),
    () => testTypingIndicators(),
    () => testOnlineStatus(),
    () => testMessageStatus(),
    () => testSignalRDisconnection(),
  ];

  // Run tests sequentially
  for (const testFn of tests) {
    try {
      await testFn();
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Test execution error:", error);
    }
  }

  const summary = testTracker.getSummary();
  summary.totalDuration = Date.now() - startTime;

  // Print summary
  console.log("\n📊 SIGNALR TEST SUMMARY");
  console.log("========================");
  console.log(
    `✅ Passed: ${summary.passed}/${summary.total} (${summary.successRate}%)`
  );
  console.log(`❌ Failed: ${summary.failed}/${summary.total}`);
  console.log(`⏱️ Total Duration: ${summary.totalDuration}ms`);

  if (summary.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testTracker.results
      .filter((result) => !result.success)
      .forEach((result) =>
        console.log(`   - ${result.testName}: ${result.error}`)
      );
  }

  console.log("\n🎉 SignalR testing complete!\n");

  return {
    summary,
    results: testTracker.results,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Quick SignalR connectivity test
 * @returns {Promise<Object>} Quick test results
 */
export async function runQuickSignalRTest() {
  console.log("\n⚡ Running quick SignalR test...");

  testTracker.clear();

  const results = {
    connection: await testSignalRConnection(),
    eventHandlers: await testEventHandlers(),
    disconnection: await testSignalRDisconnection(),
  };

  const allPassed = Object.values(results).every((result) => result.success);

  console.log(
    `\n⚡ Quick SignalR test ${allPassed ? "✅ PASSED" : "❌ FAILED"}`
  );

  return {
    success: allPassed,
    results,
  };
}

/**
 * Test SignalR service without connecting (structural tests)
 */
export async function testSignalRStructure() {
  const test = testTracker.startTest("SignalR Structure");

  try {
    console.log("🧪 Testing SignalR service structure...");

    // Test service exists and has required methods
    const requiredMethods = [
      "connect",
      "disconnect",
      "isConnected",
      "getConnectionState",
      "sendMessage",
      "joinConversation",
      "leaveConversation",
      "startTyping",
      "stopTyping",
      "updateOnlineStatus",
      "markMessageAsRead",
      "setOnMessageReceived",
      "setOnTypingChanged",
      "setOnUserOnlineStatusChanged",
      "setOnConnectionStateChanged",
      "setOnError",
    ];

    const missingMethods = requiredMethods.filter(
      (method) => typeof signalRService[method] !== "function"
    );

    if (missingMethods.length > 0) {
      throw new Error(`Missing methods: ${missingMethods.join(", ")}`);
    }

    console.log("✅ SignalR service structure is valid");

    return test.complete(true, {
      methodsChecked: requiredMethods.length,
      allMethodsPresent: true,
    });
  } catch (error) {
    console.error("❌ SignalR structure test failed:", error.message);
    return test.complete(false, null, error);
  }
}

/**
 * Example usage functions
 */
export function getSignalRTestExamples() {
  return {
    basicConnection: `
// Test basic connection
const result = await testSignalRConnection();
console.log('Connection test:', result);
    `,

    sendMessage: `
// Test sending a message
const result = await testSendMessage(1);
console.log('Send message test:', result);
    `,

    typingIndicators: `
// Test typing indicators
const result = await testTypingIndicators(1);
console.log('Typing test:', result);
    `,

    fullTest: `
// Run all SignalR tests
const results = await runSignalRTests(1);
console.log('All tests:', results);
    `,

    quickTest: `
// Run quick test
const quickResults = await runQuickSignalRTest();
console.log('Quick test:', quickResults);
    `,

    eventHandling: `
// Set up event handlers
signalRService.setOnMessageReceived((message) => {
  console.log('New message:', message);
});

signalRService.setOnTypingChanged((data) => {
  console.log('Typing status:', data);
});
    `,
  };
}

export default {
  runSignalRTests,
  runQuickSignalRTest,
  testSignalRConnection,
  testSignalRDisconnection,
  testConversationJoinLeave,
  testSendMessage,
  testTypingIndicators,
  testOnlineStatus,
  testEventHandlers,
  testMessageStatus,
  testSignalRStructure,
  getSignalRTestExamples,
  SIGNALR_TEST_CONFIG,
};
