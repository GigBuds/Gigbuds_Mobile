import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const RegisterSection = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const validate = () => {
    let newErrors = {};
    let isValid = true;

    // Full name validation
    if (!fullName) {
      newErrors.fullName = "Vui lòng nhập họ và tên của bạn.";
      isValid = false;
    }

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
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu của bạn.";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = () => {
    if (validate()) {
      // Proceed with registration logic
      Alert.alert("Thành công", "Đăng ký tài khoản thành công!");
      // TODO: Add logic to reset form fields or navigate after successful registration
      // For example:
      // setFullName("");
      // setEmail("");
      // setPassword("");
      // setConfirmPassword("");
      // setErrors({});
      // navigation.navigate('SomeOtherScreen');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={[styles.input, errors.fullName ? styles.inputError : null]}
          placeholder="Nhập Họ và tên của bạn"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (errors.fullName) setErrors(prevErrors => ({ ...prevErrors, fullName: null }));
          }}
          autoCapitalize="words"
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

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
            style={[
              styles.input,
              styles.passwordInput,
              errors.password ? styles.inputError : null,
            ]}
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Xác nhận mật khẩu</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            secureTextEntry={!showConfirmPassword}
            style={[
              styles.input,
              styles.passwordInput,
              errors.confirmPassword ? styles.inputError : null,
            ]}
            placeholder="Nhập lại mật khẩu của bạn"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
      >
        <Text style={styles.registerButtonText}>Đăng ký</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "white",
    fontSize: 16,
  },
  inputError: {
    borderColor: "red",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 5, // Makes it easier to tap
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: "#FF7345",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  registerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  orText: {
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    color: "black",
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  googleButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RegisterSection;
