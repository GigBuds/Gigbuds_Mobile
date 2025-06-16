import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import mainBg from '../../assets/main-bg.png';
import PaymentService from '../../Services/PaymentService/PaymentService';

const MembershipRegisterScreen = () => {
  const [membershipId, setMembershipId] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  const validate = () => {
    let newErrors = {};
    let isValid = true;

    if (!membershipId.trim()) {
      newErrors.membershipId = 'Vui lòng nhập Membership ID.';
      isValid = false;
    } else if (!/^\d+$/.test(membershipId)) {
      newErrors.membershipId = 'Membership ID phải là số.';
      isValid = false;
    }

    if (!userId.trim()) {
      newErrors.userId = 'Vui lòng nhập User ID.';
      isValid = false;
    } else if (!/^\d+$/.test(userId)) {
      newErrors.userId = 'User ID phải là số.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Initiating membership payment...');
      
      // Use PaymentService instead of direct fetch
      const result = await PaymentService.createMembershipPayment(
        membershipId,
        userId,
        true // isMobile
      );
      console.log(result);
      if (result.success) {
        console.log('Payment successful:', result.data);
        
        // ✅ Extract checkout URL from response - Fix nested data structure
        const paymentData = result.data.data || result.data; // Handle nested data
        const checkoutUrl = paymentData.checkoutUrl || paymentData.checkout_url || paymentData.url;
        
        if (checkoutUrl) {
          console.log('Opening checkout URL:', checkoutUrl);
          
          // Open the PayOS payment gateway
          const supported = await Linking.canOpenURL(checkoutUrl);
          
          if (supported) {
            await Linking.openURL(checkoutUrl);
            
            // Show info that user will be redirected back
            Alert.alert(
              'Chuyển hướng thanh toán',
              'Bạn sẽ được chuyển đến cổng thanh toán PayOS. Sau khi hoàn tất, ứng dụng sẽ tự động mở lại.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Lỗi', 'Không thể mở liên kết thanh toán');
          }
        } else {
          Alert.alert('Lỗi', 'Không nhận được URL thanh toán từ server');
          console.log('Available response data keys:', Object.keys(result.data));
          console.log('Payment data keys:', paymentData ? Object.keys(paymentData) : 'No payment data');
        }
      } else {
        console.log('Payment failed:', result.error);
        Alert.alert('Lỗi thanh toán', result.error);
      }
    } catch (error) {
      console.error('Unexpected payment error:', error);
      Alert.alert(
        'Lỗi kết nối', 
        'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Image
        source={mainBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký Membership</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Thông tin Membership</Text>
        <Text style={styles.formSubtitle}>
          Nhập thông tin để test payment flow
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Membership ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Membership ID</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.membershipId && styles.inputError
              ]}
              placeholder="Nhập Membership ID"
              value={membershipId}
              onChangeText={(text) => {
                setMembershipId(text);
                if (errors.membershipId) {
                  setErrors(prev => ({ ...prev, membershipId: null }));
                }
              }}
              keyboardType="numeric"
            />
            {errors.membershipId && (
              <Text style={styles.errorText}>{errors.membershipId}</Text>
            )}
          </View>

          {/* User ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>User ID</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.userId && styles.inputError
              ]}
              placeholder="Nhập User ID"
              value={userId}
              onChangeText={(text) => {
                setUserId(text);
                if (errors.userId) {
                  setErrors(prev => ({ ...prev, userId: null }));
                }
              }}
              keyboardType="numeric"
            />
            {errors.userId && (
              <Text style={styles.errorText}>{errors.userId}</Text>
            )}
          </View>

          {/* Mobile Flag Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="phone-portrait" size={20} color="#FF7345" />
            <Text style={styles.infoText}>
              IsMobile sẽ được set thành true cho mobile payment
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Đang xử lý...' : 'Bắt đầu Payment'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FF',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F3F7FF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#FF7345',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#FF7345',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MembershipRegisterScreen; 