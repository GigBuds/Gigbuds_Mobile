import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import FollowService from "../../Services/FollowService/FollowService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileHeader = ({ userProfile, employerId }) => {
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followersModalVisible, setFollowersModalVisible] = React.useState(false);
  const [followers, setFollowers] = React.useState([]);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState(null);
  console.log("User Profile:", userProfile);

  React.useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);
  // Fetch followers count when component mounts or userProfile changes
  React.useEffect(() => {
    if (employerId && currentUserId) {
      fetchFollowersCount();
    }
  }, [employerId, currentUserId]);

  const fetchFollowersCount = async () => {
    if (!employerId) return;
    
    try {
      const response = await FollowService.getFollowers(employerId);
      if (response.success) {
        setFollowerCount(response.data?.length || 0);
        // Check if current user is already following this employer
        if (currentUserId && response.data) {
          const isCurrentlyFollowing = response.data.some(
            follower => follower.followerAccountId.toString() === currentUserId.toString()
          );
          setIsFollowing(isCurrentlyFollowing);
        }
      } else {
        // Fallback to userProfile data if API fails
        setFollowerCount(userProfile?.numOfFollowers || 0);
      }
    } catch (error) {
      console.error('Error fetching followers count:', error);
      // Fallback to userProfile data if API fails
      setFollowerCount(userProfile?.numOfFollowers || 0);
    }
  };

  // Check if this is a company profile (has companyName but no firstName/lastName)
  const isCompanyProfile = userProfile?.companyName && !userProfile?.firstName;

  const completedJobs = userProfile?.numOfAvailablePost?.length || 0;
  const totalFeedbacks = userProfile?.averageRating || 0;
  const handleFollowPress = async () => {
    if (!currentUserId ) {
      Alert.alert("Lỗi", "Không thể thực hiện hành động này.");
      return;
    }

    setLoading(true);
    try {
      const response = isFollowing 
        ? await FollowService.unfollow(currentUserId,  employerId ? employerId : userProfile.accountId.toString())
        : await FollowService.follow(currentUserId, employerId ? employerId : userProfile.accountId.toString());

      if (response.success) {
        setIsFollowing(!isFollowing);
        Alert.alert("Thành công", response.message);
        // Refresh followers count after successful follow/unfollow
        await fetchFollowersCount();
      } else {
        Alert.alert("Lỗi", response.error);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi thực hiện hành động.");
      console.error('Follow/Unfollow error:', error);
    } finally {
      setLoading(false);
    }
  };  const handleFollowersPress = async () => {
    if (!employerId) {
      Alert.alert("Lỗi", "Không thể lấy danh sách người theo dõi.");
      return;
    }

    setLoading(true);
    try {
      const response = await FollowService.getFollowers(employerId);
      
      if (response.success) {
        setFollowers(response.data || []);
        // Update follower count with actual data
        setFollowerCount(response.data?.length || 0);
        // Update follow status based on current data
        if (currentUserId && response.data) {
          const isCurrentlyFollowing = response.data.some(
            follower => follower.followerAccountId.toString() === currentUserId.toString()
          );
          setIsFollowing(isCurrentlyFollowing);
        }
        setFollowersModalVisible(true);
      } else {
        Alert.alert("Lỗi", response.error);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi lấy danh sách người theo dõi.");
      console.error('Get followers error:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {/* Avatar - keeping original position */}
      <Image
        source={{
          uri:
            userProfile?.avatarUrl ||
            userProfile?.companyLogo ||
            "https://via.placeholder.com/150",
        }}
        style={styles.avatar}
      />

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {userProfile?.firstName && userProfile?.lastName
            ? `${userProfile.firstName} ${userProfile.lastName}`
            : userProfile?.companyName
            ? userProfile.companyName
            : "Chưa cập nhật tên"}
        </Text>        {/* Enhanced Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity onPress={handleFollowersPress} disabled={loading}>
            <LinearGradient
              colors={["#FF6B6B", "#FF8E53"]}
              style={styles.statCard}
            >
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.statValue}>{followerCount}</Text>
                <Text style={styles.statLabel}>người theo dõi</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <LinearGradient
            colors={["#4ECDC4", "#44A08D"]}
            style={styles.statCard}
          >
            <View style={styles.statItem}>
              <Ionicons name="briefcase" size={20} color="white" />
              <Text style={styles.statValue}>{completedJobs}</Text>
              <Text style={styles.statLabel}>công việc</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#F7971E", "#FFD200"]}
            style={styles.statCard}
          >
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.statValue}>{totalFeedbacks}</Text>
              <Text style={styles.statLabel}>đánh giá</Text>{" "}
            </View>
          </LinearGradient>
        </View>        {/* Follow Button - Only for Company Profiles */}
        {isCompanyProfile && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowPress}
            disabled={loading}
          >
            <LinearGradient
              colors={
                isFollowing ? ["#6c757d", "#495057"] : ["#2558B6", "#1e40af"]
              }
              style={styles.followButtonGradient}
            >
              <View style={{ flex:1, flexDirection: "row", alignItems: "center",justifyContent:'center', width: "100%"}}>
                <Ionicons
                  name={loading ? "hourglass" : isFollowing ? "checkmark" : "add"}
                  size={18}
                  color="white"
                  style={styles.followIcon}
                />
                <Text style={styles.followButtonText}>
                  {loading ? "Đang xử lý..." : isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Followers Modal */}
      <Modal
        visible={followersModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFollowersModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFollowersModalVisible(false)}>
              <Text style={styles.cancelButton}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Người theo dõi</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {followers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>Chưa có người theo dõi</Text>
              </View>
            ) : (
              followers.map((follower) => (
                <View key={follower.followerAccountId} style={styles.followerItem}>
                  <Image
                    source={{ 
                      uri: follower.avatarUrl || "https://via.placeholder.com/50" 
                    }}
                    style={styles.followerAvatar}
                  />
                  <View style={styles.followerInfo}>
                    <Text style={styles.followerName}>
                      {follower.firstName} {follower.lastName}
                    </Text>
                    <Text style={styles.followerSubtext}>
                      ID: {follower.followerAccountId}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 10,
  },
  avatar: {
    width: 130,
    borderColor: "white",
    borderWidth: 4,
    height: 130,
    borderRadius: 100,
    alignSelf: "center",
    position: "absolute",
    top: -110,
  },
  userInfo: {
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 5,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
    marginTop: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 3,
    fontWeight: "600",
  },
  followButton: {
    marginTop: 20,
    borderRadius: 25,
    width: "100%",
    alignContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  followingButton: {
    opacity: 0.8,
  },
  followButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  followIcon: {
    marginRight: 8,
    color: "white",
  },  followButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  followerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  followerSubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileHeader;
