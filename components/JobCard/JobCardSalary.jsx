import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const JobCardSalary = ({ salary, salaryUnit }) => {
  const getSalaryUnitText = (unit) => {
    switch(unit) {
      case "Day": return "Ngày";
      case "Shift": return "Ca";
      default: return "Giờ";
    }
  };
  return (
    <View
      style={{
        marginTop: 15,
        marginBottom: 10,
      }}
    >
      <LinearGradient
        colors={['#FF7043', '#FF5722', '#E64A19']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 15,
          paddingVertical: 8,
          borderRadius: 25,
          alignSelf: 'flex-start',
          elevation: 3,
          shadowColor: '#FF7043',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Text
          style={{ 
            color: "white", 
            fontSize: 18, 
            fontWeight: "bold",
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {salary?.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
          })}
        </Text>
        <Text style={{ 
          color: "rgba(255,255,255,0.8)", 
          fontSize: 16,
          marginHorizontal: 4,
        }}>/</Text>
        <Text style={{ 
          color: "white", 
          fontSize: 16, 
          fontWeight: "600",
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        }}>
          {getSalaryUnitText(salaryUnit)}
        </Text>
      </LinearGradient>
    </View>
  );
};

export default JobCardSalary;
