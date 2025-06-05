import { View, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import React from "react";
import JobSeekerService from "../../../Services/JobSeekerService/JobSeekerService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import ProfileHeader from "../../../components/Profile/ProfileHeader";
import LoadingComponent from "../../../components/Common/LoadingComponent";
import ErrorComponent from "../../../components/Common/ErrorComponent";
import { Text } from "react-native";

const MyProfile = () => {
  const [userProfile, setUserProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const accountId = await AsyncStorage.getItem("userId");
      console.log("Account ID:", accountId);
      
      if (!accountId) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }

      const response = await JobSeekerService.getJobSeekerById(accountId);
      
      if (response.success) {
        setUserProfile(response.data);
      } else {
        setError(response.error || "Không thể tải thông tin profile");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải thông tin profile");
    } finally {
      // Remove the artificial delay for production, keep it for testing if needed
      setTimeout(() => {
        setLoading(false);
      }, 5000);

    }
  };

  const handleRetry = () => {
    fetchUserProfile();
  };

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingComponent 
          size={80}
          speed={2000}
          showText={true}
          loadingText="Đang tải thông tin profile..."
          animationType="outline"
          strokeWidth={2.5}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorComponent error={error} onRetry={handleRetry} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ProfileHeader userProfile={userProfile} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add more profile content here */}
          <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#2558B6', 
                padding: 15, 
                borderRadius: 8, 
                marginBottom: 10, 
                width: '100%',
              }}
              onPress={() => console.log("Edit Profile Pressed")}
            >
              <Text style={{ color: 'white', fontSize: 16,  textAlign:'center' }}>Cập nhật thông tin cơ bản</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ 
                backgroundColor: '#FF6B6B', 
                padding: 15, 
                borderRadius: 8, 
                marginBottom: 10, 
                width: '100%',
              }}
              onPress={() => console.log("Logout Pressed")}
            >
              <Text style={{ color: 'white', fontSize: 16, textAlign:'center' }}>Cập nhật lịch cá nhân</Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  additionalContent: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
});

export default MyProfile;