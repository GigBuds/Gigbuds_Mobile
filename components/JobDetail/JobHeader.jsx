import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const JobHeader = ({ jobDetails }) => {
  const navigation = useNavigation();

  const handleEmployerPress = () => {
    // Use accountId as the employer ID (from the available keys in jobDetails)
    const employerId = jobDetails?.accountId;
    
    if (employerId) {
      console.log('Navigating to EmployerProfile with accountId:', employerId);
      navigation.navigate('EmployerProfile', {
        employerId: employerId
      });
    } else {
      console.log('Account ID not available in jobDetails. Available keys:', Object.keys(jobDetails || {}));
    }
  };

  return (
    <>
      <View style={styles.logoContainer}>
        <TouchableOpacity onPress={handleEmployerPress}>
          <Image
            source={{ uri: jobDetails?.companyLogo }}
            resizeMode="center"
            style={styles.logo}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.titleSection}>
        <Text style={styles.jobTitle}> {jobDetails?.jobTitle} </Text>
        <TouchableOpacity onPress={handleEmployerPress}>
          <Text style={styles.companyName}>
            {jobDetails?.companyName || "Chưa có tên công ty"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    position: "absolute",
    top: -100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  logo: {
    backgroundColor: "black",
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "white",
    height: 130,
    width: 130,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 50,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 16,
    color: "gray",
  },
});

export default JobHeader;