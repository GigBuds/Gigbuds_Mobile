import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React from "react";
import { useRoute } from "@react-navigation/native";
import JobPostService from "../../Services/JobPostService/JobPostService";
import * as Location from "expo-location";

// Import components
import JobHeader from "../../components/JobDetail/JobHeader";
import JobInfoCard from "../../components/JobDetail/JobInfoCard";
import JobDescription from "../../components/JobDetail/JobDescription";
import JobBenefits from "../../components/JobDetail/JobBenefits";
import JobLocation from "../../components/JobDetail/JobLocation";
import JobSchedule from "../../components/JobDetail/JobSchedule";
import JobFeedback from "../../components/JobDetail/JobFeedback";
import GradientButton from "../../components/JobDetail/GradientButton";
import { useLoading } from "../../context/LoadingContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import JobApplicationService from "../../Services/JobApplicationService/JobApplicationService";

const JobDetailScreen = () => {
  const route = useRoute();
  const { jobId } = route.params || {};
  const [jobDetails, setJobDetails] = React.useState(null);
  const { showLoading, hideLoading } = useLoading();
  const [coordinates, setCoordinates] = React.useState(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [hasApplied, setHasApplied] = React.useState(false);

  const fetchJobDetails = async (id) => {
    try {
      const response = await JobPostService.getJobPostById(id);
      const jobDetails = await response.data;
      setJobDetails(jobDetails);

      // Convert job location to coordinates after getting job details
      if (jobDetails?.jobLocation) {
        await convertAddressToCoordinates(jobDetails.jobLocation);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

   const checkIfApplied = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId || !jobId) {
          setHasApplied(false);
          return;
        }
        const response = await JobApplicationService.checkIfApplied(
          jobId,
          userId
        );
        if (response.success) {
          setHasApplied(false); // Assuming API returns hasApplied boolean
        } else {
          setHasApplied(true);
        }
      } catch (error) {
        console.error("Error checking application:", error);
        setHasApplied(false); // Default to false if error occurs
      } 
    };

  // Convert address to coordinates using expo-location
  const convertAddressToCoordinates = async (address) => {
    try {
      setLocationLoading(true);

      // Use expo-location geocoding to convert address to coordinates
      const geocodedLocation = await Location.geocodeAsync(address);

      if (geocodedLocation && geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];

        setCoordinates({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        console.warn("No coordinates found for address:", address);
        // Fallback to default Ho Chi Minh City coordinates
        setCoordinates({
          latitude: 10.8231,
          longitude: 106.6297,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      // Fallback to default coordinates
      setCoordinates({
        latitude: 10.8231,
        longitude: 106.6297,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } finally {
      setLocationLoading(false);
    }
  };

  React.useEffect(() => {
  const loadJobData = async () => {
    if (jobId) {
      showLoading();
      try {
        // Wait for both API calls to complete
        await Promise.all([
          fetchJobDetails(jobId),
          checkIfApplied()
        ]);
      } catch (error) {
        console.error("Error loading job data:", error);
      } finally {
        hideLoading();
      }
    } else {
      console.error("No job ID provided in route params");
    }
  };

  loadJobData();
}, [jobId]);

  // Handle button press for applying to job
  const handleApplyPress = () => {
    // Add your apply logic here
    // For example: navigate to application screen, show modal, etc.
  };



  if (!jobDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không tìm thấy thông tin công việc</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <JobHeader jobDetails={jobDetails} />

      <ScrollView style={styles.scrollContainer}>
        <JobInfoCard jobDetails={jobDetails} />

        <GradientButton
          jobDetails={jobDetails}
          hasApplied={hasApplied}
          onPress={handleApplyPress}
        />

        <JobDescription jobDetails={jobDetails} />
        <JobBenefits jobDetails={jobDetails} />
        <JobLocation
          jobDetails={jobDetails}
          coordinates={coordinates}
          locationLoading={locationLoading}
        />
        <JobSchedule jobDetails={jobDetails} />
        <JobFeedback jobDetails={jobDetails} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
  },
  scrollContainer: {
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default JobDetailScreen;
