import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import LoginLayout from "../../../layout/LoginLayout";
import { useNavigation } from "@react-navigation/native";
import RegisterService from "../../../Services/RegisterService/RegisterService";

const OTPScreen = ({ route }) => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const introTitle = "Xác thực OTP";
  const introSubtitle =
    "Vui lòng nhập mã OTP đã được gửi đến số điện thoại của bạn để xác thực tài khoản.";
  
  useEffect(() => {
    if (route.params?.phoneNumber) {
      setPhoneNumber(route.params.phoneNumber);
    }
  }, [route.params?.phoneNumber]);

  const handleVerificationCode = async () => {
    setIsLoading(true);
    try {
      const result = await RegisterService.verifyOTP(phoneNumber, verificationCode);
      
      if (result.success) {
        console.log("OTP verified successfully");
        Alert.alert("Xác thực thành công", "Mã OTP đã được xác thực thành công.");
        navigation.navigate("Login", {
          screen: "loginforJS",
        });
      } else {
        Alert.alert("Lỗi xác thực", result.error);
      }
    } catch (error) {
      console.error("Unexpected OTP verification error:", error);
      Alert.alert("Lỗi xác thực", "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    console.log("Verifying OTP:", verificationCode, "for phoneNumber:", phoneNumber);
    if (verificationCode.length === 6) {
      handleVerificationCode();
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP hợp lệ (6 chữ số).");
    }
  };

  const handleResendOtp = async () => {
    if (!phoneNumber) {
      Alert.alert("Lỗi", "Không tìm thấy số điện thoại.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await LoginService.resendOTP(phoneNumber);
      
      if (result.success) {
        Alert.alert("Thành công", "Mã OTP mới đã được gửi đến số điện thoại của bạn.");
      } else {
        Alert.alert("Lỗi", result.error);
      }
    } catch (error) {
      console.error("Unexpected resend OTP error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <LoginLayout introTitle={introTitle} introSubtitle={introSubtitle}>
        <View style={styles.container}>
          <TextInput
            style={styles.input}
            placeholder="Nhập mã OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={verificationCode}
            onChangeText={setVerificationCode}
            editable={!isLoading}
          />

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Đang xác thực..." : "Xác nhận"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleResendOtp}
            disabled={isLoading}
          >
            <Text style={[styles.resendText, isLoading && styles.resendTextDisabled]}>
              Không nhận được mã? Gửi lại
            </Text>
          </TouchableOpacity>
        </View>
      </LoginLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    marginTop: 20,
    height: "100%",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#FF7345",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  resendText: {
    color: "#2558B6",
    fontSize: 14,
  },
  resendTextDisabled: {
    color: "#ccc",
  },
});

export default OTPScreen;
