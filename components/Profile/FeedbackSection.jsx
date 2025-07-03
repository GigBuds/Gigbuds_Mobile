import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedbackService from '../../Services/FeedbackService/FeedbackService';

const FeedbackSection = ({ 
  accountId, 
  feedbackType = "All", 
  title = "Đánh giá", 
  isEmployer = false,
  existingFeedbacks = null
}) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    if (existingFeedbacks) {
      // Use existing feedback data from profile (which has correct companyLogo)
      console.log('Using existing feedbacks from profile:', existingFeedbacks);
      setFeedbacks(existingFeedbacks);
      setLoading(false);
    } else {
      // Fallback to API call if no existing data
      fetchFeedbacks();
    }
  }, [accountId, feedbackType, existingFeedbacks]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if accountId is available
      if (!accountId) {
        console.log('No accountId provided, skipping feedback fetch');
        setFeedbacks([]);
        setLoading(false);
        return;
      }
      
      const response = await FeedbackService.getFeedbacksByAccountId(accountId, feedbackType);
      
      // Debug logging to understand the API response structure
      console.log('Feedback API Response:', {
        success: response.success,
        data: response.data,
        accountId,
        feedbackType
      });
      
      if (response.success) {
        // Ensure we always have an array, even if the API returns unexpected data
        const feedbackData = response.data;
        
        if (Array.isArray(feedbackData)) {
          // Direct array response
          setFeedbacks(feedbackData);
        } else if (feedbackData && Array.isArray(feedbackData.data)) {
          // Nested response structure: response.data.data
          setFeedbacks(feedbackData.data);
        } else if (feedbackData && Array.isArray(feedbackData.items)) {
          // Handle paginated response structure
          setFeedbacks(feedbackData.items);
        } else {
          console.log('Unexpected feedback data structure:', feedbackData);
          setFeedbacks([]);
        }
      } else {
        setError(response.error);
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Không thể tải đánh giá');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#FFD700" />
      );
    }

    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getDisplayName = (feedback) => {
    if (isEmployer) {
      // For employer profile, show job seeker name
      return feedback.accountName || 'Người tìm việc';
    } else {
      // For job seeker profile, show employer name
      return feedback.employerName || 'Nhà tuyển dụng';
    }
  };

  const getDisplayAvatar = (feedback) => {
    if (isEmployer) {
      // For employer profile, show job seeker avatar
      console.log(feedback.accountAvatar);
      return feedback.accountAvatar;
          } else {
        // For job seeker profile, show company logo
        console.log('Company logo URL:', feedback.companyLogo);
        return feedback.companyLogo;
      }
  };

  const getAvatarFallback = (feedback) => {
    if (isEmployer) {
      // For employer profile, use initials from job seeker name
      const name = feedback.accountName || 'N/A';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2558B6&color=fff&size=40&format=png`;
    } else {
      // For job seeker profile, use company name initials or company icon
      const companyName = feedback.employerName || feedback.companyName || 'Company';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=FF9500&color=fff&size=40&format=png`;
    }
  };

  const renderAvatar = (feedback, index) => {
    const primaryUri = getDisplayAvatar(feedback);
    const fallbackUri = getAvatarFallback(feedback);
    const imageKey = `${index}-${primaryUri}`;
    const shouldUseFallback = !primaryUri || failedImages.has(imageKey);

    return (
      <Image
        source={{ 
          uri: shouldUseFallback ? fallbackUri : primaryUri
        }}
        style={styles.avatar}
        onError={() => {
          console.log('Avatar failed to load, using fallback for:', getDisplayName(feedback));
          setFailedImages(prev => new Set(prev).add(imageKey));
        }}
      />
    );
  };

  // Ensure feedbacks is always an array before using array methods
  const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];
  const displayedFeedbacks = showAll ? safeFeedbacks : safeFeedbacks.slice(0, 3);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2558B6" />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải đánh giá</Text>
          <TouchableOpacity onPress={fetchFeedbacks} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (safeFeedbacks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
        </View>
      </View>
    );
  }

  const averageRating = safeFeedbacks.reduce((sum, feedback) => sum + (feedback.rating || 0), 0) / safeFeedbacks.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.ratingOverview}>
          <View style={styles.starsContainer}>
            {renderStars(averageRating)}
          </View>
          <Text style={styles.ratingText}>
            {averageRating.toFixed(1)} ({safeFeedbacks.length} đánh giá)
          </Text>
        </View>
      </View>

      <ScrollView style={styles.feedbackList} showsVerticalScrollIndicator={false}>
        {displayedFeedbacks.map((feedback, index) => (
          <View key={index} style={styles.feedbackItem}>
            <View style={styles.feedbackHeader}>
              {renderAvatar(feedback, index)}
              <View style={styles.feedbackInfo}>
                <Text style={styles.feedbackName}>{getDisplayName(feedback)}</Text>
                <View style={styles.feedbackRating}>
                  {renderStars(feedback.rating)}
                  <Text style={styles.feedbackDate}>• {formatDate(feedback.createdAt)}</Text>
                </View>
              </View>
            </View>
            {feedback.comment && (
              <Text style={styles.feedbackComment}>{feedback.comment}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {safeFeedbacks.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreText}>
            {showAll ? 'Ẩn bớt' : `Xem thêm ${safeFeedbacks.length - 3} đánh giá`}
          </Text>
          <Ionicons 
            name={showAll ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#2558B6" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  feedbackList: {
    maxHeight: 300,
  },
  feedbackItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  feedbackInfo: {
    flex: 1,
  },
  feedbackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#999',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#2558B6',
    fontWeight: '600',
    marginRight: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2558B6',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default FeedbackSection; 