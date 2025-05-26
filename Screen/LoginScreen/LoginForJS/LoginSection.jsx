import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Checkbox } from "react-native-paper";

const LoginSection = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    let isValid = true;

    // Email validation
    if (!email) {
      newErrors.email = "Vui lòng nhập email của bạn.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Địa chỉ email không hợp lệ.";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu của bạn.";
      isValid = false;
    }
    // Add more password rules if needed (e.g., length)

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = () => {
    if (validate()) {
      // Proceed with login logic
      Alert.alert("Đăng nhập", `Email: ${email}, Password: ${password}, Remember Me: ${rememberMe}`);
      // TODO: Implement actual login logic (e.g., API call)
      // On success, you might navigate or clear fields
      // On failure, you might set an error message from the server
    }
  };

  return (
    <View style={styles.container}>
    <ScrollView
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}
            showsVerticalScrollIndicator={false}
          >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="Nhập email của bạn"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors(prevErrors => ({ ...prevErrors, email: null }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors(prevErrors => ({ ...prevErrors, password: null }));
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <View style={styles.extraOptionsContainer}>
          <View style={styles.rememberMeContainer}>
            <Checkbox
              theme={{ colors: { primary: "black" } }}
              status={rememberMe ? "checked" : "unchecked"}
              onPress={() => setRememberMe(!rememberMe)}
              color="#FF7345"
              uncheckedColor="black"
            />
            <Text style={styles.rememberMeText}>Ghi nhớ mật khẩu</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Đăng nhập</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>Hoặc đăng nhập bằng</Text>

      <TouchableOpacity style={styles.googleButton}>
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
