import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentService from '../../Services/PaymentService';
import LoginService from '../../Services/LoginService/LoginService';

const PaymentResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderCode } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [renewingToken, setRenewingToken] = useState(false);

  const renewIdTokenAfterPayment = useCallback(async () => {
    try {
      setRenewingToken(true);
      console.log('🔄 Renewing ID token after successful payment...');
      const userId = await LoginService.getUserIdFromToken();
      console.log('🔄 User ID:', userId);
      if (!userId) {
        console.warn('⚠️ Could not get user ID from token, skipping token renewal');
        return;
      }

      const newIdToken = await LoginService.renewIdToken(userId);
      await LoginService.updateIdToken(newIdToken);
      
      console.log('✅ ID token renewed successfully after payment');
    } catch (error) {
      console.error('❌ Error renewing ID token after payment:', error);
      // Don't throw error here as payment was successful, just log the issue
    } finally {
      setRenewingToken(false);
    }
  }, []);

  const fetchPaymentDetails = useCallback(async () => {
    if (!orderCode) {
      setLoading(false);
      setError('No order code provided');
      return;
    }

    try {
      setError(null);
      const details = await PaymentService.getPaymentDetails(orderCode);
      console.log('💰 Payment Details:', details.data);
      setPaymentDetails(details.data);
      
      const paymentStatus = details.data.data.status
      setStatus(paymentStatus);
      
      console.log('💰 Payment Status:', paymentStatus);
      console.log('📊 Full Details:', details.data);
      
      // If payment is successful, renew the ID token to include new membership info
      if (paymentStatus?.toUpperCase() === 'PAID') {
        console.log('✅ Payment successful! Renewing ID token...');
        await renewIdTokenAfterPayment();
      }
      
      // Store payment result in AsyncStorage for future reference
      await AsyncStorage.setItem(`payment_${orderCode}`, JSON.stringify({
        status: paymentStatus,
        orderCode,
        details: details.data,
        timestamp: new Date().toISOString(),
      }));
      
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError('Failed to fetch payment details');
      
      // Try to load from cache if API fails
      try {
        const cached = await AsyncStorage.getItem(`payment_${orderCode}`);
        if (cached) {
          const cachedData = JSON.parse(cached);
          setPaymentDetails(cachedData.details);
          setStatus(cachedData.status);
          setError(null);
        }
      } catch (cacheError) {
        console.error('Error loading cached payment data:', cacheError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderCode, renewIdTokenAfterPayment]);

  // Load payment details when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchPaymentDetails();
    }, [fetchPaymentDetails])
  );

  // Initial load
  // useEffect(() => {
  //   if (orderCode) {
  //     fetchPaymentDetails();
  //   } else {
  //     setLoading(false);
  //     setError('No order code provided');
  //   }
  // }, [orderCode, fetchPaymentDetails]);

  const getStatusConfig = useCallback(() => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return {
          icon: '✓',
          title: 'Payment Successful!',
          message: 'Your membership payment has been processed successfully.',
          color: '#28a745',
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
        };
      case 'CANCELLED':
        return {
          icon: '⚠',
          title: 'Payment Cancelled',
          message: 'Your payment was cancelled. You can try again anytime.',
          color: '#ffc107',
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
        };
      default:
        return {
          icon: '✗',
          title: 'Payment Failed',
          message: 'Unfortunately, your payment could not be processed. Please try again.',
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
        };
    }
  }, [status]);

  const handleGoBack = useCallback(() => {
    // Navigate to membership or home screen
    navigation.navigate('Home');
  }, [navigation]);

  const handleRetry = useCallback(() => {
    // Navigate back to membership selection
    navigation.goBack();
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  const showPaymentHelp = useCallback(() => {
    Alert.alert(
      'Payment Help',
      'If you\'re experiencing issues with your payment, please contact our support team with your order code.',
      [
        { text: 'Copy Order Code', onPress: () => console.log('Copy order code:', orderCode) },
        { text: 'OK', style: 'default' },
      ]
    );
  }, [orderCode]);

  const statusConfig = getStatusConfig();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.resultCard}>
          {/* Status Icon */}
          <View style={[
            styles.iconContainer, 
            { 
              backgroundColor: statusConfig.backgroundColor,
              borderColor: statusConfig.borderColor,
            }
          ]}>
            <Text style={[styles.icon, { color: statusConfig.color }]}>
              {statusConfig.icon}
            </Text>
          </View>

          {/* Status Title */}
          <Text style={styles.title}>{statusConfig.title}</Text>

          {/* Status Message */}
          <Text style={styles.message}>{statusConfig.message}</Text>

          {/* Token Renewal Indicator */}
          {renewingToken && (
            <View style={styles.renewingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.renewingText}>Updating your membership...</Text>
            </View>
          )}

          {/* Order Information */}
          {orderCode && (
            <View style={styles.orderInfo}>
              <Text style={styles.sectionTitle}>Transaction Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order Code:</Text>
                <Text style={styles.infoValue}>{orderCode}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[
                  styles.infoValue, 
                  { 
                    color: statusConfig.color, 
                    fontWeight: '600',
                  }
                ]}>
                  {status || 'UNKNOWN'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>
                  {new Date().toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Payment Details */}
          {paymentDetails && paymentDetails.Data && (
            <View style={styles.paymentDetails}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              {paymentDetails.Data.Amount && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount:</Text>
                  <Text style={[styles.infoValue, styles.amountText]}>
                    {paymentDetails.Data.Amount?.toLocaleString()} VND
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Method:</Text>
                <Text style={styles.infoValue}>PayOS</Text>
              </View>
              {paymentDetails.Data.CreatedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(paymentDetails.Data.CreatedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              )}
              {paymentDetails.Data.AmountPaid && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount Paid:</Text>
                  <Text style={[styles.infoValue, styles.amountText]}>
                    {paymentDetails.Data.AmountPaid?.toLocaleString()} VND
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: statusConfig.color }]} 
              onPress={handleGoBack}
            >
              <Text style={styles.primaryButtonText}>
                {status === 'PAID' ? 'Continue to Dashboard' : 'Back to Home'}
              </Text>
            </TouchableOpacity>

            {status !== 'PAID' && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.helpButton} onPress={showPaymentHelp}>
              <Text style={styles.helpButtonText}>Need Help?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  orderInfo: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  paymentDetails: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginBottom: 20,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 13,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  renewingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  renewingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
});

export default PaymentResultScreen; 