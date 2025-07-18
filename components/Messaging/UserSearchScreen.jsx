import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useMessaging } from "../../context/MessagingContext";

// Debounce helper function to avoid external dependency issues
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const UserSearchScreen = ({ onSelectUser, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { searchUsers } = useMessaging();

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await searchUsers(query);
        setUsers(results);
      } catch (err) {
        setError("Không thể tải người dùng.");
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    // Perform an initial search for all users when the component mounts
    debouncedSearch("");
  }, []);

  const handleSearch = (text) => {
    setSearchTerm(text);
    debouncedSearch(text);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onSelectUser(item)}
    >
      <Image
        source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cuộc trò chuyện mới</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Đóng</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người dùng..."
          value={searchTerm}
          onChangeText={handleSearch}
          autoFocus={true}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId.toString()}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error ? error : "Không tìm thấy người dùng. Thử tìm kiếm khác."}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 16,
    color: "#007AFF",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f8f8f8",
  },
  loader: {
    marginTop: 20,
  },
  userItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e1e1e1",
  },
  userInfo: {},
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
});

export default UserSearchScreen;
