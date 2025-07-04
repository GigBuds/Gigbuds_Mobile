import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const JobCardTags = ({ job, index, getExperienceRequirement, getDistrict }) => {
  const experienceReq = getExperienceRequirement(job.experienceRequirement);
  const isNoExperienceRequired = experienceReq === "Không yêu cầu kinh nghiệm";
  
  const getTagGradient = (type) => {
    switch(type) {
      case 'experience_no':
        return ['#FFB74D', '#FF9800']; // Orange gradient
      case 'experience_yes':
        return ['#66BB6A', '#4CAF50']; // Green gradient
      case 'urgent':
        return ['#F44336', '#D32F2F']; // Red gradient
      case 'location':
        return ['#42A5F5', '#2196F3']; // Blue gradient
      case 'vacancy':
        return ['#FFA726', '#FF9800']; // Orange gradient
      default:
        return ['#90A4AE', '#607D8B']; // Gray gradient
    }
  };
  
  const tags = [
    {
      text: isNoExperienceRequired ? "Không yêu cầu kinh nghiệm" : "Yêu cầu kinh nghiệm",
      gradient: getTagGradient(isNoExperienceRequired ? 'experience_no' : 'experience_yes'),
      type: isNoExperienceRequired ? 'experience_no' : 'experience_yes'
    },    job.isOutstandingPost ? {
      text: "Cần gấp",
      gradient: getTagGradient('urgent'),
      type: 'urgent'
    } : null,
    {
      text: getDistrict(job.jobLocation),
      gradient: getTagGradient('location'),
      type: 'location'
    },
    job.vacancyCount <= 5 ? {
      text: `Còn ${job.vacancyCount} vị trí`,
      gradient: getTagGradient('vacancy'),
      type: 'vacancy'
    } : null,
  ];

  const displayTags = tags.filter(Boolean).slice(0, 3);

  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
      {displayTags.map((tag, tagIndex) => (
        <LinearGradient
          key={`tag-${index}-${tagIndex}`}
          colors={tag.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 15,
            paddingHorizontal: 10,
            paddingVertical: 4,
            elevation: 2,
            shadowColor: tag.gradient[1],
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
          }}
        >
          <Text style={{ 
            fontSize: 10, 
            color: "white",
            fontWeight: '600',
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0.5, height: 0.5 },
            textShadowRadius: 1,
          }}>
            {tag.text}
          </Text>
        </LinearGradient>
      ))}
    </View>
  );
};

export default JobCardTags;
