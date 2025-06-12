import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'

const MembershipCard = ({ membership, onSelect, isSelected = false }) => {
  const formatPrice = (price) => {
    if (price === 0) return 'Miễn phí'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDuration = (duration) => {
    if (duration === 30) return '1 tháng'
    if (duration === 365) return '1 năm'
    return `${duration} ngày`
  }

  const parseFeatures = (description) => {
    if (!description) return []
    return description.split('\n').filter(item => item.trim())
  }

  const getCardColor = () => {
    if (membership.Price === 0) return '#f0f8ff' // Light blue for free
    if (membership.Title.toLowerCase().includes('premium')) return '#fff8dc' // Light gold for premium
    return '#f5f5f5' // Default gray
  }

  const getBorderColor = () => {
    if (isSelected) return '#2558B6'
    if (membership.Price === 0) return '#87ceeb'
    if (membership.Title.toLowerCase().includes('premium')) return '#ffd700'
    return '#ddd'
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: getCardColor(),
          borderColor: getBorderColor(),
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={() => onSelect && onSelect(membership)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{membership.Title}</Text>
          {membership.Price === 0 && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>MIỄN PHÍ</Text>
            </View>
          )}
          {membership.Title.toLowerCase().includes('premium') && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color="#fff" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}
        </View>
        
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#2558B6" />
        )}
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{formatPrice(membership.Price)}</Text>
        <Text style={styles.duration}>/{formatDuration(membership.Duration)}</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {parseFeatures(membership.Description).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons
              name={feature.includes('Không') || feature.includes('Giới hạn') ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={feature.includes('Không') || feature.includes('Giới hạn') ? '#ff6b6b' : '#51cf66'}
              style={styles.featureIcon}
            />
            <Text style={[
              styles.featureText,
              {
                color: feature.includes('Không') || feature.includes('Giới hạn') ? '#ff6b6b' : '#333'
              }
            ]}>
              {feature.replace('- ', '')}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.membershipType}>
          Dành cho: {membership.MembershipType === 'JobSeeker' ? 'Người tìm việc' : 'Nhà tuyển dụng'}
        </Text>
        {!membership.IsEnabled && (
          <Text style={styles.disabledText}>Tạm thời không khả dụng</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  freeBadge: {
    backgroundColor: '#87ceeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2558B6',
  },
  duration: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  membershipType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  disabledText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginTop: 4,
  },
})

export default MembershipCard