import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { MemberShip as MembershipData } from './data'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MembershipCard from '../../components/MemberShipCard/MemberShipCard'

const MemberShip = () => {
  const [selectedMembership, setSelectedMembership] = useState(null)
  const [userType, setUserType] = useState('JobSeeker') // Default to JobSeeker
  const [filteredMemberships, setFilteredMemberships] = useState([])

  useEffect(() => {
    // Get user type from AsyncStorage or context
    const getUserType = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('userType')
        if (storedUserType) {
          setUserType(storedUserType)
        }
      } catch (error) {
        console.error('Error getting user type:', error)
      }
    }
    getUserType()
  }, [])

  useEffect(() => {
    // Filter memberships based on user type
    const filtered = MembershipData.filter(membership => 
      membership.MembershipType === userType && membership.IsEnabled
    )
    setFilteredMemberships(filtered)
  }, [userType])

  const handleSelectMembership = (membership) => {
    setSelectedMembership(membership)
    console.log('Selected membership:', membership)
  }

  const handleUserTypeChange = (type) => {
    setUserType(type)
    setSelectedMembership(null) // Reset selection when changing user type
  }

  const handleSubscribe = () => {
    if (selectedMembership) {
      console.log('Subscribing to:', selectedMembership)
      // Handle subscription logic here
      // Navigate to payment screen or process subscription
    }
  }

  const getMembershipStats = () => {
    const totalPlans = filteredMemberships.length
    const freePlans = filteredMemberships.filter(m => m.Price === 0).length
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
            key={membership.Id}
            membership={membership}
            onSelect={handleSelectMembership}
            isSelected={selectedMembership?.Id === membership.Id}
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
              !selectedMembership && styles.disabledButton
            ]}
            onPress={handleSubscribe}
            disabled={!selectedMembership}
          >
            <Text style={styles.subscribeButtonText}>
              {selectedMembership.Price === 0 
                ? 'Sử dụng gói miễn phí' 
                : `Đăng ký với ${selectedMembership.Title}`}
            </Text>
            {selectedMembership.Price > 0 && (
              <Text style={styles.subscribeButtonSubtext}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(selectedMembership.Price)}
              </Text>
            )
            
            }
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