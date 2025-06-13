import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Checkbox } from "react-native-paper";
import LoginService from "../../../Services/LoginService/LoginService";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingComponent from "../../../components/Common/LoadingComponent";
import { useNotification } from "../../../context/notificationContext";
import NotificationService from "../../../Services/NotificationService/NotificationService";

const LoginSection = () => {
  const { expoPushToken } = useNotification();
  const [identifier, setIdentifier] = useState(""); // Changed from email to identifier
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [idToken, setIdToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    if (idToken) {
      try {
        const decodedUserInfo = jwtDecode(idToken);
        setUserInfo(decodedUserInfo);
        console.log("Decoded idToken:", decodedUserInfo);
        storeUserInfo(decodedUserInfo);
        navigation.navigate("MainApp");
      } catch (e) {
        console.error("Error decoding idToken:", e);
        Alert.alert("Lỗi", "Không thể giải mã token. Vui lòng đăng nhập lại.");
      }
    }
  }, [idToken]);

  const storeUserInfo = async (userInfo) => {
    try {
      console.log("Storing user info:", userInfo);
      await AsyncStorage.setItem(
        "userName",
        `${userInfo.family_name} ${userInfo.name}`
      );
      await AsyncStorage.setItem("userId", userInfo.sub);
      if (expoPushToken) {
        console.log("Registering push notification for user:", userInfo.sub);
        console.log("Expo push token:", expoPushToken);
        await NotificationService.registerPushNotification(
          expoPushToken,
          userInfo.sub
        );
      } else console.log("No expo push token found");
      console.log("User info stored successfully.");
    } catch (error) {
      console.error("Error storing user info:", error);
    }
  };

  // Helper function to detect if input is email or phone
  const isEmail = (input) => {
    return /\S+@\S+\.\S+/.test(input);
  };

  const isPhoneNumber = (input) => {
    // Vietnamese phone number pattern: starts with 0 and has 9-10 digits
    return /^0[3-9]\d{8,9}$/.test(input);
  };

  const validate = () => {
    let newErrors = {};
    let isValid = true;

    // Identifier validation (email or phone)
    if (!identifier) {
      newErrors.identifier = "Vui lòng nhập email hoặc số điện thoại.";
      isValid = false;
    } else if (!isEmail(identifier) && !isPhoneNumber(identifier)) {
      newErrors.identifier =
        "Vui lòng nhập email hợp lệ hoặc số điện thoại hợp lệ.";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu của bạn.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await LoginService.login(identifier, password);

      console.log("result", result);
      if (result.success) {
        // Handle successful login
        console.log("Login successful:", result.data);
        setAccessToken(result.data.access_token);
        await AsyncStorage.setItem("accessToken", result.data.access_token);
        setIdToken(result.data.id_token);
      } else {
        // Handle login error
        Alert.alert("Lỗi đăng nhập", result.error);
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      Alert.alert(
        "Lỗi đăng nhập",
        "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email hoặc Số điện thoại</Text>
          <TextInput
            style={[styles.input, errors.identifier ? styles.inputError : null]}
            placeholder="Nhập email hoặc số điện thoại"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (errors.identifier)
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  identifier: null,
                }));
            }}
            keyboardType={
              isPhoneNumber(identifier) ? "phone-pad" : "email-address"
            }
            autoCapitalize="none"
            editable={!isLoading}
          />
          {errors.identifier && (
            <Text style={styles.errorText}>{errors.identifier}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              secureTextEntry={!showPassword}
              style={[
                styles.input,
                styles.passwordInput,
                errors.password ? styles.inputError : null,
              ]}
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password)
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    password: null,
                  }));
              }}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <View style={styles.extraOptionsContainer}>
            <View style={styles.rememberMeContainer}>
              <Checkbox
                theme={{ colors: { primary: "black" } }}
                status={rememberMe ? "checked" : "unchecked"}
                onPress={() => setRememberMe(!rememberMe)}
                color="#FF7345"
                uncheckedColor="black"
                disabled={isLoading}
              />
              <Text style={styles.rememberMeText}>Ghi nhớ mật khẩu</Text>
            </View>
            <TouchableOpacity disabled={isLoading}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.orText}>Hoặc đăng nhập bằng</Text>

        <TouchableOpacity style={styles.googleButton} disabled={isLoading}>
          <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%", // Assuming the parent provides padding if needed
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: "#333", // A common color for labels
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10, // Consistent padding
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 16, // Readable font size
  },
  inputError: {
    borderColor: "red",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative", // For absolute positioning of the eye icon
  },
  passwordInput: {
    flex: 1, // Take up available space
  },
  eyeIcon: {
    position: "absolute",
    right: 12, // Adjust as needed
    padding: 5, // Makes it easier to tap
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  extraOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    marginLeft: 0, // Checkbox usually has its own padding
    fontSize: 14,
    color: "#333",
  },
  forgotPasswordText: {
    color: "#2558B6",
    fontWeight: "bold",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#FF7345",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 24, // More space before the primary action
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  orText: {
    textAlign: "center",
    marginTop: 24, // Consistent spacing
    marginBottom: 16,
    color: "black",
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1, // Add a border to distinguish it
    borderColor: "#ccc",
  },
  googleButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default LoginSection;
