import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { databaseService } from "../Services/DatabaseService/DatabaseService";
import { testDatabaseService } from "../Services/DatabaseService/DatabaseTest";

export default function ServerDataDemoScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState("");

  const runDatabaseTest = async () => {
    setIsLoading(true);
    setResults("Running database tests...\n");

    try {
      const success = await testDatabaseService();
      setResults(
        (prev) => prev + `\nDatabase test ${success ? "PASSED" : "FAILED"}\n`
      );
    } catch (error) {
      setResults((prev) => prev + `\nDatabase test FAILED: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestData = async () => {
    Alert.alert(
      "Clear Test Data",
      "This will remove all conversations and messages containing 'Test User' while preserving real user data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Test Data",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await databaseService.clearTestData();
              setResults("✅ Test data cleared successfully!\n");
              Alert.alert(
                "Success",
                "Test data has been cleared from local database."
              );
            } catch (error) {
              setResults(`❌ Failed to clear test data: ${error.message}\n`);
              Alert.alert(
                "Error",
                `Failed to clear test data: ${error.message}`
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "⚠️ WARNING: This will permanently delete ALL conversations and messages. This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await databaseService.clearAllData();
              setResults("🗑️ All messaging data cleared!\n");
              Alert.alert("Success", "All messaging data has been cleared.");
            } catch (error) {
              setResults(`❌ Failed to clear data: ${error.message}\n`);
              Alert.alert("Error", `Failed to clear data: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStats = async () => {
    setIsLoading(true);
    try {
      const stats = await databaseService.getStats();
      setResults(
        `📊 Database Statistics:\n${JSON.stringify(stats, null, 2)}\n`
      );
    } catch (error) {
      setResults(`❌ Failed to get stats: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkMessageSorting = async () => {
    setIsLoading(true);
    setResults("Checking message sorting...\n");

    try {
      const conversations = await databaseService.getConversations();

      if (conversations.length === 0) {
        setResults((prev) => prev + "⚠️ No conversations found to test\n");
        return;
      }

      const conversationId = conversations[0].id;
      const messages = await databaseService.getMessages(conversationId, 20);

      if (messages.length < 2) {
        setResults(
          (prev) => prev + "⚠️ Need at least 2 messages to test sorting\n"
        );
        return;
      }

      // Check if messages are sorted by timestamp (oldest to newest)
      let isSorted = true;
      let sortingIssues = [];

      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].timestamp).getTime();
        const currTime = new Date(messages[i].timestamp).getTime();

        if (prevTime > currTime) {
          isSorted = false;
          sortingIssues.push(
            `Message ${i - 1} (${
              messages[i - 1].timestamp
            }) appears before Message ${i} (${messages[i].timestamp})`
          );
        }
      }

      if (isSorted) {
        setResults(
          (prev) => prev + "✅ Messages are properly sorted chronologically\n"
        );
        setResults(
          (prev) =>
            prev +
            `📊 Checked ${messages.length} messages in conversation ${conversationId}\n`
        );
      } else {
        setResults((prev) => prev + "❌ Messages are NOT properly sorted:\n");
        sortingIssues.forEach((issue) => {
          setResults((prev) => prev + `  - ${issue}\n`);
        });
      }
    } catch (error) {
      setResults(
        (prev) =>
          prev + `❌ Failed to check message sorting: ${error.message}\n`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showDatabaseStats = async () => {
    setIsLoading(true);
    setResults("Getting database statistics...\n");

    try {
      const stats = await databaseService.getStats();
      setResults((prev) => prev + `📊 Database Statistics:\n`);
      setResults(
        (prev) => prev + `  - Conversations: ${stats.conversationCount}\n`
      );
      setResults((prev) => prev + `  - Messages: ${stats.messageCount}\n`);
      setResults(
        (prev) => prev + `  - Deleted Messages: ${stats.deletedMessageCount}\n`
      );
    } catch (error) {
      setResults(
        (prev) => prev + `❌ Failed to get database stats: ${error.message}\n`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Management</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={runDatabaseTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧪 Run Database Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.checkButton]}
          onPress={checkMessageSorting}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>📊 Check Message Sorting</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={showDatabaseStats}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>📈 Database Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cleanButton]}
          onPress={clearTestData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧹 Clear Test Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🗑️ Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>{results}</Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#007AFF",
  },
  checkButton: {
    backgroundColor: "#34C759",
  },
  infoButton: {
    backgroundColor: "#5856D6",
  },
  cleanButton: {
    backgroundColor: "#FF9500",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  resultsText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#333",
    lineHeight: 20,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
