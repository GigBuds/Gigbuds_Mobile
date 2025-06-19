import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'

const MembershipCard = ({ membership, onSelect, isSelected = false, isCurrentlySubscribed = false }) => {
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
    if (isCurrentlySubscribed) return '#E8F5E8' // Light green for active
    if (isSelected) return '#E3F2FD' // Light blue for selected
    if (membership.price === 0) return '#F8F9FA' // Light gray for free
    if (membership.title.toLowerCase().includes('premium')) return '#FFF9E6' // Light amber for premium
    return '#FFFFFF' // White for others
  }

  const getBorderColor = () => {
    if (isCurrentlySubscribed) return '#28A745' // Green for active
    if (isSelected) return '#2196F3' // Blue for selected
    if (membership.price === 0) return '#6C757D' // Gray for free
    if (membership.title.toLowerCase().includes('premium')) return '#FF9800' // Orange for premium
    return '#E0E0E0' // Light gray for others
  }

  const getBorderWidth = () => {
    if (isCurrentlySubscribed || isSelected) return 2
    return 1
  }

  const getIconColor = () => {
    if (membership.price === 0) return '#6C757D'
    if (membership.title.toLowerCase().includes('premium')) return '#FF9800'
    return '#2196F3'
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: getCardColor(),
          borderColor: getBorderColor(),
          borderWidth: getBorderWidth(),
          transform: [{ scale: isCurrentlySubscribed ? 1.02 : 1 }]
        }
      ]}
      onPress={() => onSelect && onSelect(membership)}
      activeOpacity={0.7}
    >
      {/* Active Membership Ribbon */}
      {isCurrentlySubscribed && (
        <View style={styles.activeRibbon}>
          <Text style={styles.activeRibbonText}>ĐANG SỬ DỤNG</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              { color: isCurrentlySubscribed ? '#28A745' : '#333' }
            ]}>
              {membership.title}
            </Text>
            {isCurrentlySubscribed && (
              <Ionicons name="checkmark-circle" size={20} color="#28A745" style={styles.activeIcon} />
            )}
          </View>
          
          <View style={styles.badgeContainer}>
            {membership.price === 0 && (
              <View style={styles.freeBadge}>
                <Ionicons name="gift" size={12} color="#fff" />
                <Text style={styles.freeBadgeText}>MIỄN PHÍ</Text>
              </View>
            )}
            {membership.title.toLowerCase().includes('premium') && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>
        </View>
        
        {isSelected && !isCurrentlySubscribed && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
          </View>
        )}
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <View style={styles.priceContainer}>
          <Text style={[
            styles.price,
            { color: isCurrentlySubscribed ? '#28A745' : '#2196F3' }
          ]}>
            {formatPrice(membership.price)}
          </Text>
          <Text style={styles.duration}>/{formatDuration(membership.duration)}</Text>
        </View>
        
        {membership.price > 0 && (
          <View style={styles.pricePerDay}>
            <Text style={styles.pricePerDayText}>
              ≈ {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(Math.round(membership.price / membership.duration))}/ngày
            </Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Quyền lợi:</Text>
        {parseFeatures(membership.description).slice(0, 4).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: getIconColor() + '20' }]}>
              <Ionicons
                name={feature.includes('Không') || feature.includes('Giới hạn') ? 'close' : 'checkmark'}
                size={12}
                color={feature.includes('Không') || feature.includes('Giới hạn') ? '#DC3545' : getIconColor()}
              />
            </View>
            <Text style={[
              styles.featureText,
              {
                color: feature.includes('Không') || feature.includes('Giới hạn') ? '#DC3545' : '#333'
              }
            ]}>
              {feature.replace('- ', '')}
            </Text>
          </View>
        ))}
        
        {parseFeatures(membership.description).length > 4 && (
          <Text style={styles.moreFeatures}>
            +{parseFeatures(membership.description).length - 4} quyền lợi khác
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.membershipTypeContainer}>
          <Ionicons 
            name={membership.membershipType === 'JobSeeker' ? 'person' : 'business'} 
            size={14} 
            color="#666" 
          />
          <Text style={styles.membershipType}>
            {membership.membershipType === 'JobSeeker' ? 'Người tìm việc' : 'Nhà tuyển dụng'}
          </Text>
        </View>
        
        {isCurrentlySubscribed && (
          <View style={styles.activeStatusContainer}>
            <View style={styles.activeDot} />
            <Text style={styles.activeStatusText}>Đang hoạt động</Text>
          </View>
        )}
      </View>

      {/* Glow effect for active membership */}
      {isCurrentlySubscribed && <View style={styles.glowEffect} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  activeRibbon: {
    position: 'absolute',
    top: 20,
    right: -30,
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 6,
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },
  activeRibbonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  activeIcon: {
    marginLeft: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freeBadge: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  premiumBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
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
  selectedIndicator: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 2,
  },
  priceSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  pricePerDay: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pricePerDayText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipType: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  activeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28A745',
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '600',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: '#28A745',
    opacity: 0.1,
    zIndex: -1,
  },
})

export default MembershipCard