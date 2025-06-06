import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const ProfileHeader = ({ userProfile }) => {
  const getJobPosition = () => {
    return userProfile?.accountExperienceTags?.slice(-1)[0]?.jobPosition ||
           "Chưa cập nhật vị trí công việc";
  };

  const followerCount = userProfile?.followerCount || 0;
  const completedJobs = userProfile?.accountExperienceTags?.length || 0;
  const totalFeedbacks = userProfile?.totalFeedbacks || 0;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image
        source={{
          uri: userProfile?.avatarUrl || "https://via.placeholder.com/150",
        }}
        style={styles.avatar}
      />
      
      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {userProfile?.lastName} {userProfile?.firstName}
        </Text>
        {/* <Text style={styles.jobPosition}>
          {getJobPosition()}
        </Text> */}
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{followerCount}</Text>
            <Text style={styles.statLabel}> người theo dõi</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedJobs}</Text>
            <Text style={styles.statLabel}> công việc hoàn thành</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalFeedbacks}</Text>
            <Text style={styles.statLabel}> đánh giá</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
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
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  jobPosition: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  statValue: {
    fontSize: 15,
    color: "#2558B6",
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#737373",
  },
});

export default ProfileHeader;