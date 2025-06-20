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
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [currentMembershipId, setCurrentMembershipId] = useState(null)
  const [currentMembership, setCurrentMembership] = useState(null)
  const [membershipEndDate, setMembershipEndDate] = useState(null)

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

  // Check membership status when userId and membershipData are available
  useEffect(() => {
    if (userId && MembershipData.length > 0) {
      checkSubscribedMembership()
    }
  }, [userId, MembershipData])

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
  }

  const checkSubscribedMembership = async () => {
    try {
      const response = await MembershipService.checkMembership(userId)
      console.log('Check membership response:', response.data)
      
      // Check if response is an array and has active memberships
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Find the first active membership
        const activeMembership = response.data.find(membership => 
          membership.status === 'Active'
        )
        console.log('Active membership found:', activeMembership)
        
        if (activeMembership) {
          
          // Find the current membership in the membership data
          const currentMembershipData = MembershipData.find(
            membership => membership.id === activeMembership.membershipId
          )
          
          if (currentMembershipData) {
            setIsSubscribed(true)
            setCurrentMembershipId(activeMembership.membershipId)
            setCurrentMembership(currentMembershipData)
            setMembershipEndDate(activeMembership.endDate)
            console.log('User is subscribed to:', currentMembershipData.title)
            console.log('Membership expires on:', activeMembership.endDate)
          } else {
            setIsSubscribed(false)
            setCurrentMembershipId(null)
            setCurrentMembership(null)
            setMembershipEndDate(null)
          }
        } else {
          // No active membership found in the array
          setIsSubscribed(false)
          setCurrentMembershipId(null)
          setCurrentMembership(null)
          setMembershipEndDate(null)
          console.log('No active membership found in response array')
        }
      } else {
        // Empty array or no response
        setIsSubscribed(false)
        setCurrentMembershipId(null)
        setCurrentMembership(null)
        setMembershipEndDate(null)
        console.log('No membership data found (empty array or no response)')
      }
    } catch (error) {
      console.error('Error checking membership:', error)
      // Don't show alert for membership check errors as it might be normal for new users
      setIsSubscribed(false)
      setCurrentMembershipId(null)
      setCurrentMembership(null)
      setMembershipEndDate(null)
    }
  }

  const handleRevokeMembership = async () => {
    if (!currentMembershipId) return

    Alert.alert(
      'Hủy gói thành viên',
      `Bạn có chắc chắn muốn hủy gói "${currentMembership?.title}"? Bạn sẽ mất tất cả quyền lợi của gói này.`,
      [
        {
          text: 'Hủy bỏ',
          style: 'cancel'
        },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true)
            try {
              // Call API to revoke membership
              const response = await MembershipService.revokeMembership(userId, currentMembershipId)
              
              if (response.success) {
                Alert.alert('Thành công', 'Đã hủy gói thành viên thành công!')
                setIsSubscribed(false)
                setCurrentMembershipId(null)
                setCurrentMembership(null)
                setMembershipEndDate(null)
                // Refresh membership status
                await checkSubscribedMembership()
              } else {
                Alert.alert('Lỗi', response.error || 'Không thể hủy gói thành viên. Vui lòng thử lại sau.')
              }
            } catch (error) {
              console.error('Error revoking membership:', error)
              Alert.alert('Lỗi', 'Đã xảy ra lỗi khi hủy gói thành viên. Vui lòng thử lại sau.')
            } finally {
              setIsLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleSubscribe = async () => {
    if (!selectedMembership) return

    // If user is already subscribed to a different membership, ask for confirmation
    if (isSubscribed && currentMembershipId !== selectedMembership.id) {
      Alert.alert(
        'Thay đổi gói thành viên',
        `Bạn đang sử dụng gói "${currentMembership?.title}". Để đăng ký gói mới, bạn cần hủy gói hiện tại trước. Bạn có muốn tiếp tục?`,
        [
          {
            text: 'Hủy bỏ',
            style: 'cancel'
          },
          {
            text: 'Tiếp tục',
            onPress: () => handleRevokeMembership()
          }
        ]
      )
      return
    }

    // If user is already subscribed to the same membership
    if (isSubscribed && currentMembershipId === selectedMembership.id) {
      Alert.alert(
        'Đã đăng ký',
        `Bạn đã đăng ký gói "${selectedMembership.title}" này rồi.`,
        [
          {
            text: 'OK',
            style: 'default'
          },
          {
            text: 'Hủy gói này',
            style: 'destructive',
            onPress: () => handleRevokeMembership()
          }
        ]
      )
      return
    }

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
            onPress: async () => {
              setIsLoading(true)
              try {
                // Handle free membership activation
                console.log('Activating free membership:', selectedMembership)
                
                // Call API to activate free membership
                const response = await MembershipService.activateFreeMembership(userId, selectedMembership.id)
                
                if (response.success) {
                  Alert.alert('Thành công', 'Gói miễn phí đã được kích hoạt!')
                  setIsSubscribed(true)
                  setCurrentMembershipId(selectedMembership.id)
                  setCurrentMembership(selectedMembership)
                  // Refresh membership status
                  await checkSubscribedMembership()
                } else {
                  Alert.alert('Lỗi', response.error || 'Không thể kích hoạt gói miễn phí.')
                }
              } catch (error) {
                console.error('Error activating free membership:', error)
                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi kích hoạt gói miễn phí.')
              } finally {
                setIsLoading(false)
              }
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
              [{ 
                text: 'OK',
                onPress: () => {
                  // Refresh membership status after payment attempt
                  setTimeout(() => {
                    checkSubscribedMembership()
                  }, 2000)
                }
              }]
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

  const getButtonText = () => {
    if (isLoading) return 'Đang xử lý...'
    
    if (!selectedMembership) return 'Chọn gói thành viên'
    
    // If user is subscribed to the selected membership
    if (isSubscribed && currentMembershipId === selectedMembership.id) {
      return 'Đã đăng ký'
    }
    
    // If it's a free membership
    if (selectedMembership.price === 0) {
      return 'Sử dụng gói miễn phí'
    }
    
    // For paid memberships
    return `Đăng ký với ${selectedMembership.title}`
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
        {isSubscribed && currentMembership && (
          <View style={styles.currentSubscriptionContainer}>
            <Text style={styles.currentSubscription}>
              Đang sử dụng: {currentMembership.title}
            </Text>
            {membershipEndDate && (
              <Text style={styles.expirationDate}>
                Hết hạn: {new Date(membershipEndDate).toLocaleDateString('vi-VN')}
              </Text>
            )}
          </View>
        )}
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
            isCurrentlySubscribed={isSubscribed && currentMembershipId === membership.id}
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
              (!selectedMembership || isLoading) && styles.disabledButton,
              (isSubscribed && currentMembershipId === selectedMembership.id) && styles.subscribedButton
            ]}
            onPress={handleSubscribe}
            disabled={!selectedMembership || isLoading}
          >
            <View style={styles.subscribeButtonContent}>
              {isLoading && (
                <Ionicons name="card" size={20} color="white" style={styles.buttonIcon} />
              )}
              {(isSubscribed && currentMembershipId === selectedMembership.id) && !isLoading && (
                <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
              )}
              <View style={styles.subscribeButtonTextContainer}>
                <Text style={styles.subscribeButtonText}>
                  {getButtonText()}
                </Text>
                {selectedMembership.price > 0 && !(isSubscribed && currentMembershipId === selectedMembership.id) && (
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
  currentSubscriptionContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF4F1',
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FFE5DC',
  },
  currentSubscription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FF7345',
    fontWeight: '600',
  },
  expirationDate: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginTop: 2,
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
  subscribedButton: {
    backgroundColor: '#28a745',
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