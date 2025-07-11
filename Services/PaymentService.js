import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import api from './api'; // Make sure this points to your configured axios instance

const PaymentService = {
  /**
   * Creates a mobile membership payment
   * @param {number} membershipId - The ID of the membership to purchase
   * @returns {Promise<Object>} Payment response with checkout URL
   */
  async createMobileMembershipPayment(membershipId) {
    try {
      console.log('🔑 Authen token membership payment:', token);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await api.post(
        '/Payments/memberships',
        { membershipId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating mobile membership payment:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Processes mobile payment result after PayOS completion
   * @param {string} orderCode - The order code from PayOS
   * @param {string} status - The payment status from PayOS
   * @returns {Promise<Object>} Processing result
   */
  async processMobilePayment(orderCode, status) {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔑 Authen token:', token);
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await api.post(
        '/Payments/process-mobile-payment',
        { 
          orderCode: orderCode,
          status: status 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Payment processed successfully',
      };
    } catch (error) {
      console.error('Error processing mobile payment:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to process payment',
        status: error.response?.status,
      };
    }
  },

  /**
   * Opens a payment URL in the default browser
   * @param {string} url - The payment checkout URL
   * @returns {Promise<void>}
   */
  async openPaymentUrl(url) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error(`Cannot open payment URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening payment URL:', error);
      throw error;
    }
  },

  /**
   * Gets payment details by order code
   * @param {string} orderCode - The order code to look up
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentDetails(orderCode) {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await api.get(`/Payments/${orderCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('💰 Payment Details:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting payment details:', error.response?.data || error.message);
      throw error;
    }
  },


};

export default PaymentService;