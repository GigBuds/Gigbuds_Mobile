import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';

const OTPScreen = ({ route }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(''); // To store the entered OTP

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  const handleVerifyOtp = () => {
    // TODO: Implement OTP verification logic here
    console.log('Verifying OTP:', otp, 'for email:', email);
    // If verification is successful, navigate to the next screen (e.g., Home or set password)
    // If failed, show an error message
  };

  const handleResendOtp = () => {
    // TODO: Implement Resend OTP logic here
    console.log('Resending OTP to:', email);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác thực OTP</Text>
      {email ? (
        <Text style={styles.subtitle}>
          Một mã OTP đã được gửi đến địa chỉ email: <Text style={styles.emailText}>{email}</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>Đang tải thông tin email...</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Nhập mã OTP"
        keyboardType="number-pad"
        maxLength={6} // Assuming a 6-digit OTP
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
        <Text style={styles.buttonText}>Xác nhận</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendOtp}>
        <Text style={styles.resendText}>Không nhận được mã? Gửi lại</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F7FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
    paddingHorizontal: 10,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#FF7345',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#FF7345',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendText: {
    color: '#2558B6',
    fontSize: 14,
  },
});

export default OTPScreen;