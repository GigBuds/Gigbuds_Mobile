import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedbackService from '../../Services/FeedbackService/FeedbackService';

const FeedbackDialog = ({ 
  visible, 
  onClose, 
  jobData, 
  jobSeekerId, 
  onFeedbackSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Lỗi', 'Vui lòng nhập ít nhất 10 ký tự cho nhận xét');
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate that we have the required jobHistoryId
      if (!jobData.jobHistoryId || jobData.jobHistoryId === 0) {
        Alert.alert('Lỗi', 'Không thể gửi feedback cho công việc này. Vui lòng thử lại sau.');
        setIsSubmitting(false);
        return;
      }

      const feedbackData = {
        jobSeekerId: parseInt(jobSeekerId),
        employerId: jobData.accountId, // employer ID from backend response
        jobHistoryId: jobData.jobHistoryId, // now properly available from backend
        rating: rating,
        comment: comment.trim(),
        feedbackType: "JobSeekerToEmployer"
      };

      console.log('Submitting JobSeeker feedback:', feedbackData);

      const response = await FeedbackService.createFeedback(feedbackData);

      if (response.success) {
        Alert.alert('Thành công', 'Đánh giá đã được gửi thành công!');
        handleClose();
        onFeedbackSubmitted && onFeedbackSubmitted();
      } else {
        Alert.alert('Lỗi', response.error || 'Có lỗi xảy ra khi gửi đánh giá');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? "#FFD700" : "#DDD"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Rất không hài lòng';
      case 2: return 'Không hài lòng';
      case 3: return 'Bình thường';
      case 4: return 'Hài lòng';
      case 5: return 'Rất hài lòng';
      default: return 'Chọn số sao để đánh giá';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Đánh giá nhà tuyển dụng</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Job Info */}
          <View style={styles.jobInfo}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobTitle}>{jobData?.jobTitle}</Text>
              <Text style={styles.companyName}>{jobData?.companyName}</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá tổng thể *</Text>
            {renderStars()}
            <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhận xét chi tiết *</Text>
            <TextInput
              style={styles.textInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Chia sẻ trải nghiệm làm việc với nhà tuyển dụng này..."
              multiline={true}
              numberOfLines={4}
              maxLength={500}
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                Tối thiểu 10 ký tự
              </Text>
              <Text style={styles.characterCountText}>
                {comment.length}/500
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.submitButton,
                (rating === 0 || comment.trim().length < 10 || isSubmitting) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || comment.trim().length < 10 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Gửi đánh giá
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  jobInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  jobHeader: {
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2558B6',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default FeedbackDialog; 