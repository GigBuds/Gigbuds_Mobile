import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JobSeekerService from "../../../Services/JobSeekerService/JobSeekerService";
import LoadingComponent from "../../../components/Common/LoadingComponent";
import ErrorComponent from "../../../components/Common/ErrorComponent";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNavigation } from "@react-navigation/native";

// Import new components
import EditProfileHeader from "../../../components/EditProfile/EditProfileHeader";
import PersonalInfoForm from "../../../components/EditProfile/PersonalInfoForm";
import SkillsForm from "../../../components/EditProfile/SkillsForm";
import EducationForm from "../../../components/EditProfile/EducationForm";
import ExperienceForm from "../../../components/EditProfile/ExperienceForm";
import { useLoading } from "../../../context/LoadingContext";

const EditProfile = ({ route }) => {
  const navigation = useNavigation();
  
  // Safely get initialProfile from route params
  const initialProfile = route?.params?.userProfile || null;
  
  const [userProfile, setUserProfile] = React.useState(initialProfile);
    const { showLoading, hideLoading } = useLoading();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [datePickerFor, setDatePickerFor] = React.useState('');

  // Initialize form data with initialProfile if available
  const [formData, setFormData] = React.useState({
    firstName: initialProfile?.firstName || "",
    lastName: initialProfile?.lastName || "",
    currentLocation: initialProfile?.currentLocation || "",
    dob: initialProfile?.dob ? new Date(initialProfile.dob) : new Date(),
    isMale: initialProfile?.isMale !== undefined ? initialProfile.isMale : true,
    skillTags: initialProfile?.skillTags || [],
    educationalLevels: initialProfile?.educationalLevels || [],
    accountExperienceTags: initialProfile?.accountExperienceTags || []
  });

  const [newSkill, setNewSkill] = React.useState("");
  const [newSkillName, setNewSkillName] = React.useState("");

  const educationLevels = ["High", "Primary", "University"];

  // Update form data when initialProfile changes
  React.useEffect(() => {
    showLoading(); // Show loading when initialProfile changes
    if (initialProfile) {
      setFormData({
        firstName: initialProfile.firstName || "",
        lastName: initialProfile.lastName || "",
        currentLocation: initialProfile.currentLocation || "",
        dob: initialProfile.dob ? new Date(initialProfile.dob) : new Date(),
        isMale: initialProfile.isMale !== undefined ? initialProfile.isMale : true,
        skillTags: initialProfile.skillTags || [],
        educationalLevels: initialProfile.educationalLevels || [],
        accountExperienceTags: initialProfile.accountExperienceTags || []
      });
      setUserProfile(initialProfile);
      hideLoading(); // Hide loading if initialProfile is provided
    }
  }, [initialProfile]);

  const fetchUserProfile = async () => {
    // Skip API call if we already have initial profile
    if (initialProfile) {
      hideLoading();
      return;
    }

    try {
      showLoading();
      setError(null);
      const accountId = await AsyncStorage.getItem("userId");

      if (!accountId) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }

      const response = await JobSeekerService.getJobSeekerById(accountId);

      if (response.success) {
        setUserProfile(response.data);
        setFormData({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          currentLocation: response.data.currentLocation || "",
          dob: response.data.dob ? new Date(response.data.dob) : new Date(),
          isMale: response.data.isMale !== undefined ? response.data.isMale : true,
          skillTags: response.data.skillTags || [],
          educationalLevels: response.data.educationalLevels || [],
          accountExperienceTags: response.data.accountExperienceTags || []
        });
      } else {
        setError(response.error || "Không thể tải thông tin profile");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải thông tin profile");
    } finally {
      hideLoading();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  // Date picker handlers
  const hideDatePicker = () => {
    setShowDatePicker(false);
    setDatePickerFor('');
  };

  const handleDateConfirm = (selectedDate) => {
    if (selectedDate) {
      if (datePickerFor === 'dob') {
        handleInputChange('dob', selectedDate);
      } else if (datePickerFor.startsWith('education_')) {
        const [type, index, field] = datePickerFor.split('_');
        const updatedEducation = [...formData.educationalLevels];
        updatedEducation[parseInt(index)][field] = selectedDate.toISOString();
        handleInputChange('educationalLevels', updatedEducation);
      } else if (datePickerFor.startsWith('experience_')) {
        const [type, index, field] = datePickerFor.split('_');
        const updatedExperience = [...formData.accountExperienceTags];
        updatedExperience[parseInt(index)][field] = selectedDate.toISOString();
        handleInputChange('accountExperienceTags', updatedExperience);
      }
    }
    hideDatePicker();
  };

  const showDatePickerModal = (type, index = null, field = null) => {
    if (type === 'dob') {
      setDatePickerFor('dob');
    } else if (type === 'education') {
      setDatePickerFor(`education_${index}_${field}`);
    } else if (type === 'experience') {
      setDatePickerFor(`experience_${index}_${field}`);
    }
    setShowDatePicker(true);
  };

  // Get current date for picker based on context
  const getCurrentPickerDate = () => {
    if (datePickerFor === 'dob') {
      return formData.dob;
    } else if (datePickerFor.startsWith('education_')) {
      const [type, index, field] = datePickerFor.split('_');
      const edu = formData.educationalLevels[parseInt(index)];
      return edu ? new Date(edu[field]) : new Date();
    } else if (datePickerFor.startsWith('experience_')) {
      const [type, index, field] = datePickerFor.split('_');
      const exp = formData.accountExperienceTags[parseInt(index)];
      return exp ? new Date(exp[field]) : new Date();
    }
    return new Date();
  };

  // Skills management
  const addSkill = () => {
    if (newSkill.trim() && newSkillName.trim()) {
      const newSkillObject = {
        id: parseInt(newSkill),
        skillName: newSkillName.trim()
      };
      const updatedSkills = [...formData.skillTags, newSkillObject];
      handleInputChange('skillTags', updatedSkills);
      setNewSkill("");
      setNewSkillName("");
    } else if (newSkill.trim()) {
      const newSkillObject = {
        id: parseInt(newSkill),
        skillName: `Skill ${newSkill}`
      };
      const updatedSkills = [...formData.skillTags, newSkillObject];
      handleInputChange('skillTags', updatedSkills);
      setNewSkill("");
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = formData.skillTags.filter((_, i) => i !== index);
    handleInputChange('skillTags', updatedSkills);
  };

  const renderSkillText = (skill) => {
    if (typeof skill === 'object' && skill !== null) {
      return `${skill.skillName || 'Unknown Skill'} (ID: ${skill.id || 'N/A'})`;
    }
    return `Skill ID: ${skill}`;
  };

  // Education management
  const addEducation = () => {
    const newEducation = {
      major: "",
      schoolName: "",
      level: "Bachelor",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString()
    };
    const updatedEducation = [...formData.educationalLevels, newEducation];
    handleInputChange('educationalLevels', updatedEducation);
  };

  const updateEducation = (index, field, value) => {
    const updatedEducation = [...formData.educationalLevels];
    updatedEducation[index][field] = value;
    handleInputChange('educationalLevels', updatedEducation);
  };

  const removeEducation = (index) => {
    const updatedEducation = formData.educationalLevels.filter((_, i) => i !== index);
    handleInputChange('educationalLevels', updatedEducation);
  };

  // Experience management
  const addExperience = () => {
    const newExperience = {
      jobPosition: "",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString()
    };
    const updatedExperience = [...formData.accountExperienceTags, newExperience];
    handleInputChange('accountExperienceTags', updatedExperience);
  };

  const updateExperience = (index, field, value) => {
    const updatedExperience = [...formData.accountExperienceTags];
    updatedExperience[index][field] = value;
    handleInputChange('accountExperienceTags', updatedExperience);
  };

  const removeExperience = (index) => {
    const updatedExperience = formData.accountExperienceTags.filter((_, i) => i !== index);
    handleInputChange('accountExperienceTags', updatedExperience);
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên");
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const accountId = await AsyncStorage.getItem("userId");

      const processedSkillTags = formData.skillTags.map(skill => {
        if (typeof skill === 'object' && skill !== null) {
          return skill.id || skill;
        }
        return skill;
      });

      const dataToSend = {
        ...formData,
        dob: formData.dob.toISOString(),
        skillTags: processedSkillTags
      };

      console.log("Data to send:", dataToSend);

      const response = await JobSeekerService.updateJobSeeker(accountId, dataToSend);
      
      Alert.alert(
        "Thành công", 
        "Thông tin profile đã được cập nhật",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Lỗi", "Không thể lưu thông tin profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.",
      [
        { text: "Ở lại", style: "cancel" },
        { text: "Hủy", onPress: () => navigation.goBack() }
      ]
    );
  };

  React.useEffect(() => {
    fetchUserProfile();
  }, []);


  if (error) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorComponent error={error} onRetry={fetchUserProfile} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          isDarkModeEnabled={true}
          date={getCurrentPickerDate()}
          minimumDate={datePickerFor === 'dob' ? new Date(1900, 0, 1) : undefined}
          maximumDate={new Date()}
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
        />

        {/* Header */}
        <EditProfileHeader 
          onCancel={handleCancel}
          onSave={handleSave}
          saving={saving}
        />

        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Personal Information */}
            <PersonalInfoForm 
              formData={formData}
              onInputChange={handleInputChange}
              onDatePress={showDatePickerModal}
              formatDate={formatDate}
            />

            {/* Skills Section */}
            <SkillsForm 
              skillTags={formData.skillTags}
              newSkill={newSkill}
              newSkillName={newSkillName}
              onNewSkillChange={setNewSkill}
              onNewSkillNameChange={setNewSkillName}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
              renderSkillText={renderSkillText}
            />

            {/* Education Section */}
            <EducationForm 
              educations={formData.educationalLevels}
              onAddEducation={addEducation}
              onUpdateEducation={updateEducation}
              onRemoveEducation={removeEducation}
              onDatePress={showDatePickerModal}
              educationLevels={educationLevels}
            />

            {/* Experience Section */}
            <ExperienceForm 
              experiences={formData.accountExperienceTags}
              onAddExperience={addExperience}
              onUpdateExperience={updateExperience}
              onRemoveExperience={removeExperience}
              onDatePress={showDatePickerModal}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
});

export default EditProfile;