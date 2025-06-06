import {
  View,
  SafeAreaView,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import JobSeekerService from "../../../Services/JobSeekerService/JobSeekerService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ProfileHeader from "../../../components/Profile/ProfileHeader";
import LoadingComponent from "../../../components/Common/LoadingComponent";
import ErrorComponent from "../../../components/Common/ErrorComponent";
import ProfileButtons from "../../../components/Profile/ProfileButtons";
import SkillsSection from "../../../components/Profile/SkillsSection";
import ExperienceSection from "../../../components/Profile/ExperienceSection";
import EducationSection from "../../../components/Profile/EducationSection";
import PersonalInfoSection from "../../../components/Profile/PersonalInfoSection";

const MyProfile = () => {
  const [userProfile, setUserProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const accountId = await AsyncStorage.getItem("userId");

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
      console.log("User Profile:", userProfile);
      setTimeout(() => {
        setLoading(false);
      }, 4500);
    }
  };

  const handleRetry = () => {
    fetchUserProfile();
  };

  const handleEditProfile = () => {
    console.log("Edit Profile Pressed");
  };

  const handleUpdateSchedule = () => {
    console.log("Update Schedule Pressed");
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
          <ProfileButtons 
            onEditProfile={handleEditProfile}
            onUpdateSchedule={handleUpdateSchedule}
          />
          
          <SkillsSection skills={userProfile.skillTags} />
          
          <ExperienceSection experiences={userProfile.accountExperienceTags} />
          
          <EducationSection educations={userProfile.educationalLevels} />
          
          <PersonalInfoSection userProfile={userProfile} />
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  safeArea: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
});

export default MyProfile;
