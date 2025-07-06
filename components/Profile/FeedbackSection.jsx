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
      </View>      <ScrollView 
        style={styles.feedbackList} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {displayedFeedbacks.map((feedback, index) => (
          <View key={index} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              {renderAvatar(feedback, index)}
              <View style={styles.feedbackInfo}>
                <Text style={styles.feedbackName}>{getDisplayName(feedback)}</Text>
                {feedback.jobTitle && (
                  <Text style={styles.feedbackJobTitle}>{feedback.jobTitle}</Text>
                )}
                <View style={styles.feedbackRating}>
                  <View style={styles.starsWrapper}>
                    {renderStars(feedback.rating)}
                  </View>
                  <Text style={styles.feedbackDate}>{formatDate(feedback.createdAt)}</Text>
                </View>
              </View>
            </View>
            {feedback.comment && (
              <View style={styles.commentContainer}>
                <Text style={styles.feedbackComment}>{feedback.comment}</Text>
              </View>
            )}
          </View>
        ))}
        
        {/* Show a visual indicator when more feedbacks are displayed */}
        {showAll && safeFeedbacks.length > 3 && (
          <View style={styles.showAllIndicator}>
            <Text style={styles.showAllText}>
              Hiển thị tất cả {safeFeedbacks.length} đánh giá
            </Text>
          </View>
        )}
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
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },feedbackList: {
    maxHeight: 400,
  },
  feedbackCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  feedbackItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  feedbackInfo: {
    flex: 1,
  },
  feedbackName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  feedbackJobTitle: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  commentContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2558B6',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    fontStyle: 'italic',
  },  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    paddingVertical: 32,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  errorText: {
    fontSize: 14,
    color: '#e53e3e',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2558B6',
    borderRadius: 8,
    shadowColor: '#2558B6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
    fontWeight: '500',
  },
  showAllIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    marginTop: 8,
  },
  showAllText: {
    fontSize: 14,
    color: '#2558B6',
    fontWeight: '600',
  },
});

export default FeedbackSection; 