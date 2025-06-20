import { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  View,
  Alert,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JobApplicationService from "../../Services/JobApplicationService/JobApplicationService";
import UploadFile from "../../Services/FireBase/Upload";
import * as DocumentPicker from "expo-document-picker";

const GradientButton = ({
  jobDetails,
  colors = ["#FF7345", "#FFDC95"],
  start = { x: 0, y: 0 },
  end = { x: 1.5, y: 0 },
}) => {

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const checkIfApplied = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId || !jobDetails?.id) {
          setHasApplied(false);
          return;
        }
        const response = await JobApplicationService.checkIfApplied(
          jobDetails.id,
          userId
        );
        console.log("Check application response:", response);
        if (response.success) {
          setHasApplied(false); // Assuming API returns hasApplied boolean
        } else {
          setHasApplied(true);
        }
      } catch (error) {
        console.error("Error checking application:", error);
        setHasApplied(false); // Default to false if error occurs
      } 
    };
    checkIfApplied();
  }, [jobDetails]);

  const getButtonText = () => {
    if (hasApplied) {
      return "Đã ứng tuyển";
    }
    if (!jobDetails?.vacancyCount || jobDetails.vacancyCount <= 0) {
      return "Hiện tại không có vị trí tuyển dụng";
    }
    return `Chỉ còn ${jobDetails.vacancyCount} vị trí !`;
  };

  // Button is disabled if already applied, no vacancy, or currently applying
  const isDisabled = hasApplied || 
                    !jobDetails?.vacancyCount || 
                    jobDetails.vacancyCount <= 0 || 
                    isApplying;

  // Handle button press to show modal
  const handlePress = () => {
    if (!isDisabled) {
      setModalVisible(true);
    } else if (hasApplied) {
      Alert.alert("Thông báo", "Bạn đã ứng tuyển vào vị trí này rồi!");
    }
  };

  // Handle PDF file picker
  const pickPDFFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedPDF(file);
        console.log("Selected PDF:", file);
      }
    } catch (error) {
      console.error("Error picking PDF:", error);
      Alert.alert("Lỗi", "Không thể chọn file PDF");
    }
  };

  // Handle job application
  const applyForJob = async () => {
    if (!selectedPDF) {
      Alert.alert("Thông báo", "Vui lòng chọn file CV (PDF)");
      return;
    }

    try {
      setIsApplying(true);
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
        return;
      }

      const cvFile = {
        uri: selectedPDF.uri,
        type: selectedPDF.mimeType || 'application/pdf',
        name: selectedPDF.name,
      };

      // Submit job application with the file
      const response = await JobApplicationService.applyForJob(
        jobDetails.id,
        userId,
        cvFile
      );

      console.log("Application response:", response);
      if (!response.success) {
        Alert.alert(
          "Lỗi",
          response.error || "Đã xảy ra lỗi khi nộp đơn ứng tuyển."
        );
        return;
      } else {
        // Update hasApplied state after successful application
        setHasApplied(true);
        
        Alert.alert(
          "Thành công",
          "Ứng tuyển thành công! Chúng tôi sẽ liên hệ với bạn sớm.",
          [
            {
              text: "OK",
              onPress: () => {
                setModalVisible(false);
                setSelectedPDF(null);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi ứng tuyển. Vui lòng thử lại.");
    } finally {
      setIsApplying(false);
    }
  };

  // Get button colors based on state
  const getButtonColors = () => {
    if (hasApplied) {
      return ["#6c757d", "#adb5bd"]; // Gray colors for applied state
    }
    if (isDisabled) {
      return ["#dee2e6", "#f8f9fa"]; // Light gray for disabled
    }
    return colors; // Original colors for active state
  };

  return (
    <>
      <LinearGradient
        colors={getButtonColors()}
        start={start}
        end={end}
        style={[
          styles.gradientButton,
          isDisabled && styles.disabledGradientButton
        ]}
      >
        <TouchableOpacity 
          onPress={handlePress} 
          style={styles.touchableArea}
          disabled={isDisabled && !hasApplied} // Allow press on hasApplied to show alert
        >
          <Text style={[
            styles.buttonText,
            isDisabled && styles.disabledButtonText
          ]}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Confirm Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận ứng tuyển</Text>
            <Text style={styles.modalSubtitle}>
              Bạn có muốn ứng tuyển vào vị trí "{jobDetails?.jobTitle}" tại{" "}
              {jobDetails?.companyName}?
            </Text>

            {/* PDF Upload Section */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Tải lên CV (PDF) *</Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickPDFFile}
              >
                <Text style={styles.uploadButtonText}>
                  {selectedPDF ? "Chọn file khác" : "Chọn file PDF"}
                </Text>
              </TouchableOpacity>

              {selectedPDF && (
                <View style={styles.selectedFileInfo}>
                  <Text style={styles.fileName}>{selectedPDF.name}</Text>
                  <Text style={styles.fileSize}>
                    {(selectedPDF.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
              )}
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedPDF(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedPDF || isApplying) && styles.disabledButton,
                ]}
                onPress={applyForJob}
                disabled={!selectedPDF || isApplying}
              >
                <Text style={styles.confirmButtonText}>
                  {isApplying ? "Đang ứng tuyển..." : "Ứng tuyển"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  gradientButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  disabledGradientButton: {
    opacity: 0.6,
  },
  touchableArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButtonText: {
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#2558B6",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    lineHeight: 22,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  uploadButton: {
    backgroundColor: "#2558B6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedFileInfo: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: "#666",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default GradientButton;

