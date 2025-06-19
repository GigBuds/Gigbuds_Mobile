import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native'
import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MembershipCard from '../../components/MemberShipCard/MemberShipCard'
import MembershipService from '../../Services/MembershipService/MembershipService'
import PaymentService from '../../Services/PaymentService/PaymentService'
import Ionicons from '@expo/vector-icons/Ionicons'

const MemberShip = () => {
  const [selectedMembership, setSelectedMembership] = useState(null)
  const [userType, setUserType] = useState('JobSeeker') // Default to JobSeeker
  const [filteredMemberships, setFilteredMemberships] = useState([])
  const [MembershipData, setMembershipData] = useState([])
  const [userId, setUserId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchMembershipData = async () => {
    try {
      const response = await MembershipService.getMemberships()
      console.log('Membership data fetched:', response.data)
      if (response && response.data) {
        setMembershipData(response.data)
      } else {
        console.error('Failed to fetch membership data:', response.error)
      }
    } catch (error) { 
      console.error('Error fetching membership data:', error)
    }
  }

  const getUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId')
      setUserId(userId)
      console.log('User ID retrieved:', userId)
    } catch (error) {
      console.error('Error getting user ID:', error)
    }
  }

  // Fetch membership data and user ID on component mount
  useEffect(() => {
    fetchMembershipData()
    getUserId()
  }, [])

  // Filter memberships when data or userType changes
  useEffect(() => {
    if (MembershipData && MembershipData.length > 0) {
      const filtered = MembershipData.filter(membership => 
        membership.membershipType === userType
      )
      setFilteredMemberships(filtered)
      console.log('Filtered memberships:', filtered)
    }
  }, [MembershipData, userType])

  const handleSelectMembership = (membership) => {
    setSelectedMembership(membership)
    console.log('Selected membership:', membership)
  }

  const handleSubscribe = async () => {
    if (!selectedMembership) return

    // If it's a free membership, handle differently
    if (selectedMembership.price === 0) {
      Alert.alert(
        'Gói miễn phí',
        'Bạn đã chọn gói miễn phí. Gói này sẽ được kích hoạt ngay lập tức.',
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Kích hoạt',
            onPress: () => {
              // Handle free membership activation
              console.log('Activating free membership:', selectedMembership)
              Alert.alert('Thành công', 'Gói miễn phí đã được kích hoạt!')
            }
          }
        ]
      )
      return
    }

    // For paid memberships, validate required data
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
      return
    }

    setIsLoading(true)

    try {
      console.log('Initiating membership payment...')
      
      const result = await PaymentService.createMembershipPayment(
        selectedMembership.id.toString(),
        userId.toString(),
        true // isMobile
      )

      console.log('Payment result:', result)

      if (result.success) {
        console.log('Payment successful:', result.data)
        
        // Extract checkout URL from response
        const paymentData = result.data.data || result.data
        const checkoutUrl = paymentData.checkoutUrl || paymentData.checkout_url || paymentData.url
        
        if (checkoutUrl) {
          console.log('Opening checkout URL:', checkoutUrl)
          
          // Open the PayOS payment gateway
          const supported = await Linking.canOpenURL(checkoutUrl)
          
          if (supported) {
            await Linking.openURL(checkoutUrl)
            
            // Show info that user will be redirected back
            Alert.alert(
              'Chuyển hướng thanh toán',
              'Bạn sẽ được chuyển đến cổng thanh toán PayOS. Sau khi hoàn tất, ứng dụng sẽ tự động mở lại.',
              [{ text: 'OK' }]
            )
          } else {
            Alert.alert('Lỗi', 'Không thể mở liên kết thanh toán')
          }
        } else {
          Alert.alert('Lỗi', 'Không nhận được URL thanh toán từ server')
          console.log('Available response data keys:', Object.keys(result.data))
          console.log('Payment data keys:', paymentData ? Object.keys(paymentData) : 'No payment data')
        }
      } else {
        console.log('Payment failed:', result.error)
        Alert.alert('Lỗi thanh toán', result.error || 'Đã xảy ra lỗi trong quá trình thanh toán')
      }
    } catch (error) {
      console.error('Unexpected payment error:', error)
      Alert.alert(
        'Lỗi kết nối', 
        'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getMembershipStats = () => {
    const totalPlans = filteredMemberships.length
    const freePlans = filteredMemberships.filter(m => m.price === 0).length
    const paidPlans = totalPlans - freePlans
    
    return { totalPlans, freePlans, paidPlans }
  }

  const stats = getMembershipStats()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chọn Gói Thành Viên</Text>
        <Text style={styles.subtitle}>
          {userType === 'JobSeeker' 
            ? 'Nâng cấp để có trải nghiệm tìm việc tốt hơn' 
            : 'Nâng cấp để đăng tin tuyển dụng hiệu quả'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {stats.totalPlans} gói có sẵn • {stats.freePlans} miễn phí • {stats.paidPlans} trả phí
        </Text>
      </View>
      
      {/* Membership Cards */}
      <ScrollView style={selectedMembership ? styles.scrollViewWithButton : styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredMemberships.map((membership) => (
          <MembershipCard
            key={membership.id}
            membership={membership}
            onSelect={handleSelectMembership}
            isSelected={selectedMembership?.id === membership.id}
          />
        ))}
        
        {filteredMemberships.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Không có gói thành viên nào khả dụng cho {userType === 'JobSeeker' ? 'người tìm việc' : 'nhà tuyển dụng'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Subscribe Button */}
      {selectedMembership && (
        <View style={styles.subscribeContainer}>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              (!selectedMembership || isLoading) && styles.disabledButton
            ]}
            onPress={handleSubscribe}
            disabled={!selectedMembership || isLoading}
          >
            <View style={styles.subscribeButtonContent}>
              {isLoading && (
                <Ionicons name="card" size={20} color="white" style={styles.buttonIcon} />
              )}
              <View style={styles.subscribeButtonTextContainer}>
                <Text style={styles.subscribeButtonText}>
                  {isLoading 
                    ? 'Đang xử lý...' 
                    : selectedMembership.price === 0 
                      ? 'Sử dụng gói miễn phí' 
                      : `Đăng ký với ${selectedMembership.title}`}
                </Text>
                {selectedMembership.price > 0 && (
                  <Text style={styles.subscribeButtonSubtext}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(selectedMembership.price)}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsText: {
    fontSize: 12,
    color: '#FF7345',
  },
  scrollView: {
    marginBottom: 50,
    flex: 1,
  },
  scrollViewWithButton: {
    marginBottom: 5,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subscribeContainer: {
    paddingBottom: 50,
  },
  subscribeButton: {
    backgroundColor: '#FF7345',
    paddingVertical: 15,
    minHeight: 65,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  subscribeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  subscribeButtonTextContainer: {
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribeButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
})

export default MemberShip