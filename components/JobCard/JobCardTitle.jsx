import React from 'react';
import { Text } from 'react-native';

const JobCardTitle = ({ jobTitle, searchTerm }) => {  // Highlight search term in job title
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      return (
        <Text
          style={{ 
            fontWeight: "bold", 
            fontSize: 18, 
            width: "80%",
            color: "#2C3E50",
            textShadowColor: 'rgba(0,0,0,0.1)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      );
    }

    const regex = new RegExp(`(${searchTerm.trim()})`, "gi");
    const parts = text.split(regex);

    return (
      <Text
        style={{ 
          fontWeight: "bold", 
          fontSize: 18, 
          width: "80%",
          color: "#2C3E50",
          textShadowColor: 'rgba(0,0,0,0.1)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {parts.map((part, index) => (
          <Text
            key={index}
            style={{
              backgroundColor: regex.test(part) ? "#FFD54F" : "transparent",
              fontWeight: "bold",
              fontSize: 18,
              color: regex.test(part) ? "#E65100" : "#2C3E50",
              borderRadius: regex.test(part) ? 4 : 0,
              paddingHorizontal: regex.test(part) ? 2 : 0,
            }}
          >
            {part}
          </Text>
        ))}
      </Text>
    );
  };

  return highlightSearchTerm(jobTitle, searchTerm);
};

export default JobCardTitle;
