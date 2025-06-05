import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'react-native';

const JobHeader = ({ jobDetails }) => {
  return (
    <>
      <Image
        source={{ uri: jobDetails?.companyLogo }}
        resizeMode="center"
        style={styles.logo}
      />
      <View style={styles.titleSection}>
        <Text style={styles.jobTitle}> {jobDetails?.jobTitle} </Text>
        <TouchableOpacity>
          <Text style={styles.companyName}>
            {jobDetails?.companyName || "Chưa có tên công ty"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  logo: {
    backgroundColor: "black",
    position: "absolute",
    top: -100,
    zIndex: 1,
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