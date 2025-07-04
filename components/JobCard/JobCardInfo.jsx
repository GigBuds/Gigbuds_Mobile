import React from 'react';
import { View, Text } from 'react-native';

const JobCardInfo = ({ 
  companyName, 
  jobLocation, 
  selectedTab, 
  formattedDistance, 
  updatedAt, 
  getCity, 
  getTimeAgo 
}) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: "gray", fontSize: 10 }}>
        {companyName}
      </Text>
      <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
      <Text style={{ color: "gray", fontSize: 10 }}>
        {getCity(jobLocation)}
      </Text>
      <Text style={{ color: "gray", fontSize: 10 }}> - </Text>
      <Text style={{ color: "gray", fontSize: 10 }}>
        {selectedTab === "Gợi Ý"
          ? formattedDistance
          : getTimeAgo(updatedAt)}
      </Text>
    </View>
  );
};

export default JobCardInfo;
