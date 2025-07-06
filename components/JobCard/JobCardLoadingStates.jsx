import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

const JobCardLoadingStates = ({
  locationLoading,
  loadingMore,
  hasMoreData,
  jobDataLength,
  debouncedSearchInput,
  selectedTab,
}) => {
  // Loading initial data
  if (locationLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>
          <ActivityIndicator size="large" color="#FF7345" />
        </Text>
        <Text style={styles.loadingText}>Đang tải công việc...</Text>
      </View>
    );
  }

  // Load more indicator
  if (loadingMore) {
    return (
      <View style={styles.loadMoreContainer}>
        <Text>
          <ActivityIndicator size="large" color="#FF7345" />
        </Text>
        <Text style={styles.loadMoreText}>Đang tải thêm công việc...</Text>
      </View>
    );
  }

  // End of list indicator
  if (!hasMoreData && jobDataLength > 0) {
    return (
      <View style={styles.endOfListContainer}>
        <Text style={styles.endOfListText}>
          Đã hiển thị tất cả {jobDataLength} công việc
        </Text>
      </View>
    );
  }

  // No data message
  if (jobDataLength === 0) {
    const getNoDataMessage = () => {
      if (debouncedSearchInput?.trim()) {
        return `Không tìm thấy công việc với từ khóa "${debouncedSearchInput}"`;
      }
      return selectedTab === "Gợi Ý"
        ? "Không có công việc gợi ý trong vòng 50km."
        : "Không có dữ liệu công việc.";
    };

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>{getNoDataMessage()}</Text>
      </View>
    );
  }

  // Return null if no state matches
  return null;
};

const styles = {
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 10,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreText: {
    marginTop: 10,
    color: "gray",
    fontSize: 14,
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  endOfListText: {
    color: "gray",
    fontSize: 14,
    fontStyle: "italic",
  },
  noDataText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
  },
};

export default JobCardLoadingStates;
