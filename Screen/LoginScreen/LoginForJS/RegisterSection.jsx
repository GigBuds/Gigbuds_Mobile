import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
} from "react-native";
import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RegisterService from "../../../Services/RegisterService/RegisterService";

const RegisterSection = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [socialSecurityNumber, setSocialSecurityNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [handlePassFocus, setHandlePassFocus] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    console.warn("A date has been picked: ", date);
    setDob(date);
    setErrors((prev) => ({ ...prev, dob: null }));
    hideDatePicker();
  };

  const selectGender = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Hủy", "Nam", "Nữ"],
        cancelButtonIndex: 0,
        title: "Chọn giới tính",
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          setGender(true);
          setErrors((prev) => ({ ...prev, gender: null }));
        } else if (buttonIndex === 2) {
          setGender(false);
          setErrors((prev) => ({ ...prev, gender: null }));
        }
      }
    );
  };

  const validate = () => {
    let newErrors = {};
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập họ.";
      isValid = false;
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập tên.";
      isValid = false;
    }
    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Địa chỉ email không hợp lệ.";
      isValid = false;
    }
    if (!socialSecurityNumber.trim()) {
      newErrors.socialSecurityNumber = "Vui lòng nhập số CCCD.";
      isValid = false;
    } else if (!/^\d{12}$/.test(socialSecurityNumber)) {
      newErrors.socialSecurityNumber = "Số CCCD phải có 12 chữ số.";
      isValid = false;
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại.";
      isValid = false;
    } else if (!/^(0\d{9})$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ.";
      isValid = false;
    }
    if (gender === "") {
      newErrors.gender = "Vui lòng chọn giới tính.";
      isValid = false;
    }
    if (!dob) {
      newErrors.dob = "Vui lòng chọn ngày sinh.";
      isValid = false;
    }
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
      isValid = false;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    const apiData = {
      dob: dob ? dob.toISOString() : null,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password,
      socialSecurityNumber: socialSecurityNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      isMale: gender,
    };

    console.log("Submitting API Data:", apiData);

    try {
      const result = await RegisterService.register(apiData);

      if (result.success) {
        console.log("Registration successful:", result.data);
        Alert.alert(
          "Đăng ký thành công",
          "Vui lòng kiểm tra tin nhắn để xác thực tài khoản."
        );
        navigation.navigate("otpscreen", { phoneNumber: apiData.phoneNumber });
      } else {
        Alert.alert("Lỗi đăng ký", result.error);
      }
    } catch (error) {
      console.error("Unexpected registration error:", error);
      Alert.alert(
        "Lỗi đăng ký",
        "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scrollViewRef = React.useRef(null);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={{
        paddingHorizontal: 10,
        paddingBottom: handlePassFocus ? 300 : 70,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        isDarkModeEnabled={true}
        date={dob || new Date(1900, 0, 1)}
        minimumDate={new Date(1900, 0, 1)}
        maximumDate={new Date()}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      {/* Name inputs */}
      <View style={styles.nameContainer}>
        <View style={styles.nameInputGroup}>
          <Text style={styles.label}>Họ</Text>
          <TextInput
            style={[styles.input, errors.firstName ? styles.inputError : null]}
            placeholder="Nhập họ"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (errors.firstName)
                setErrors((prev) => ({ ...prev, firstName: null }));
            }}
            autoCapitalize="words"
            editable={!isLoading}
          />
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>
        <View style={styles.nameInputGroup}>
          <Text style={styles.label}>Tên</Text>
          <TextInput
            style={[styles.input, errors.lastName ? styles.inputError : null]}
            placeholder="Nhập tên"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (errors.lastName)
                setErrors((prev) => ({ ...prev, lastName: null }));
            }}
            autoCapitalize="words"
            editable={!isLoading}
          />
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>
      </View>

      {/* Email input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="Nhập email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* CCCD and Gender inputs */}
      <View style={styles.idAndGenderContainer}>
        <View style={styles.idInputGroup}>
          <Text style={styles.label}>Căn Cước Công Dân</Text>
          <TextInput
            style={[
              styles.input,
              errors.socialSecurityNumber ? styles.inputError : null,
            ]}
            placeholder="Nhập số CCCD"
            value={socialSecurityNumber}
            onChangeText={(text) => {
              setSocialSecurityNumber(text);
              setErrors((prev) => ({ ...prev, socialSecurityNumber: null }));
            }}
            keyboardType="numeric"
            maxLength={12}
            editable={!isLoading}
          />
          {errors.socialSecurityNumber && (
            <Text style={styles.errorText}>{errors.socialSecurityNumber}</Text>
          )}
        </View>
        <View style={styles.genderInputGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <View
            style={[
              styles.pickerContainer,
              errors.gender ? styles.inputError : null,
            ]}
          >
            {Platform.OS === "ios" ? (
              <TouchableOpacity onPress={selectGender} disabled={isLoading}>
                <Text
                  style={{
                    padding: 12,
                    color: gender === "" ? "gray" : "black",
                  }}
                >
                  {gender === ""
                    ? "Chọn giới tính"
                    : gender === true
                    ? "Nam"
                    : "Nữ"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Picker
                selectedValue={gender}
                onValueChange={(itemValue) => {
                  setGender(itemValue);
                  if (errors.gender)
                    setErrors((prev) => ({ ...prev, gender: null }));
                }}
                style={styles.picker}
                prompt="Chọn giới tính"
                dropdownIconColor="#333"
                mode="dropdown"
                enabled={!isLoading}
              >
                <Picker.Item
                  label="Chọn giới tính"
                  value=""
                  style={styles.pickerItemPlaceholder}
                />
                <Picker.Item label="Nam" value={true} />
                <Picker.Item label="Nữ" value={false} />
              </Picker>
            )}
          </View>
          {errors.gender && (
            <Text style={styles.errorText}>{errors.gender}</Text>
          )}
        </View>
      </View>

      {/* Phone number input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
          placeholder="Nhập số điện thoại"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            if (errors.phoneNumber)
              setErrors((prev) => ({ ...prev, phoneNumber: null }));
          }}
          keyboardType="phone-pad"
          maxLength={10}
          editable={!isLoading}
        />
        {errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        )}
      </View>

      {/* Date of birth input */}
      <View style={{ width: "100%", marginBottom: 16 }}>
        <Text style={styles.label}>Ngày sinh</Text>
        <TouchableOpacity
          onPress={showDatePicker}
          style={[styles.input, errors.dob ? styles.inputError : null]}
          disabled={isLoading}
        >
          <Text>{dob ? dob.toLocaleDateString() : "Chọn ngày sinh"}</Text>
        </TouchableOpacity>
        {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
      </View>

      {/* Password inputs */}
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
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: null }));
            }}
            onFocus={() => {
              setHandlePassFocus(true);
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            onBlur={() => setHandlePassFocus(false)}
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
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            onFocus={() => {
              setHandlePassFocus(true);
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            onBlur={() => setHandlePassFocus(false)}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
            disabled={isLoading}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="black"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.registerButtonText}>
          {isLoading ? "Đang đăng ký..." : "Đăng ký"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: "100%",
    flex: 1,
  },

  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nameInputGroup: {
    width: "48%", // Adjust for spacing
  },
  idAndGenderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  idInputGroup: {
    width: "48%",
  },
  genderInputGroup: {
    width: "48%",
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
    height: 48, // Consistent height for inputs
    justifyContent: "center", // For date picker text
  },
  inputError: {
    borderColor: "red",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "white",
    height: 48, // Match input height
    zIndex: 1, // Ensure picker is above other elements
    justifyContent: "center",
  },
  picker: {
    position: "absolute",
    zIndex: 1, // Ensure picker is above other elements
    top: 0,
    height: "100%",
    width: "100%",
  },
  pickerItemPlaceholder: {
    color: "#a9a9a9", // Style for placeholder item if needed
  },
  datePickerInput: {
    justifyContent: "center",
  },
  datePickerText: {
    fontSize: 16,
    color: "#000",
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: "#a9a9a9", // Placeholder color
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
    padding: 5,
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
    marginBottom: 20, // Ensure button is not cut off
  },
  registerButtonDisabled: {
    backgroundColor: "#ccc",
  },
  registerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RegisterSection;
