import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import EmployerService from '../../Services/EmployerService/EmployerService';
import FeedbackSection from '../../components/Profile/FeedbackSection';
import { useLoading } from '../../context/LoadingContext';
import ErrorComponent from '../../components/Common/ErrorComponent';

const { width: screenWidth } = Dimensions.get('window');

const EmployerProfile = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { employerId } = route.params || {};
  const { showLoading, hideLoading } = useLoading();

  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'jobs'

  useEffect(() => {
    if (employerId) {
      fetchEmployerProfile();
    } else {
      setError('Không tìm thấy thông tin nhà tuyển dụng');
      hideLoading();
    }
  }, [employerId]);

  const fetchEmployerProfile = async () => {
    try {
      showLoading();
      setError(null);

      const response = await EmployerService.getEmployerProfile(employerId);

      if (response.success) {
        setEmployerData(response.data);
        
        // Convert address to coordinates if available
        if (response.data?.companyAddress) {
          await convertAddressToCoordinates(response.data.companyAddress);
        }
      } else {
        setError(response.error || 'Không thể tải thông tin nhà tuyển dụng');
      }
    } catch (err) {
      console.error('Error fetching employer profile:', err);
      setError('Đã xảy ra lỗi khi tải thông tin nhà tuyển dụng');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const convertAddressToCoordinates = async (address) => {
    try {
      setLocationLoading(true);
      console.log('Converting address to coordinates:', address);

      const geocodedLocation = await Location.geocodeAsync(address);

      if (geocodedLocation && geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        console.log('Coordinates found:', { latitude, longitude });

        setCoordinates({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        console.warn('No coordinates found for address:', address);
        // Fallback to default Ho Chi Minh City coordinates
        setCoordinates({
          latitude: 10.8231,
          longitude: 106.6297,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
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

  const handleRetry = () => {
    fetchEmployerProfile();
  };

  const formatNumber = (number) => {
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'k';
    }
    return number.toString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ErrorComponent error={error} onRetry={handleRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Company Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ 
              uri: employerData?.companyLogo || 'https://via.placeholder.com/100x100?text=Company' 
            }}
            style={styles.companyLogo}
          />
          <Text style={styles.companyName}>{employerData?.companyName}</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {formatNumber(employerData?.followersCount || 0)}
              </Text>
              <Text style={styles.statLabel}>người theo dõi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {formatNumber(employerData?.jobPostsCount || 0)}
              </Text>
              <Text style={styles.statLabel}>tin tuyển dụng</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {employerData?.averageRating ? employerData.averageRating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.statLabel}>đánh giá</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Giới thiệu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
            onPress={() => setActiveTab('jobs')}
          >
            <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>
              Tin tuyển dụng
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? (
          <>
            {/* Company Description */}
            {employerData?.companyDescription && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mô tả</Text>
                <View style={styles.descriptionContainer}>
                  <Ionicons name="business-outline" size={20} color="#2558B6" />
                  <Text style={styles.description}>{employerData.companyDescription}</Text>
                </View>
              </View>
            )}

            {/* Benefits */}
            {employerData?.benefits && employerData.benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quyền lợi</Text>
                <View style={styles.benefitsContainer}>
                  {employerData.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Location */}
            {employerData?.companyAddress && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Địa chỉ</Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={20} color="#2558B6" />
                  <Text style={styles.address}>{employerData.companyAddress}</Text>
                </View>
                
                {/* Map */}
                {coordinates && (
                  <View style={styles.mapContainer}>
                    <Text style={styles.mapTitle}>Xem bản đồ</Text>
                    <View style={styles.mapWrapper}>
                      {locationLoading ? (
                        <View style={styles.mapLoadingContainer}>
                          <ActivityIndicator size="small" color="#2558B6" />
                          <Text style={styles.mapLoadingText}>Đang tải bản đồ...</Text>
                        </View>
                      ) : (
                        <MapView
                          style={styles.map}
                          region={coordinates}
                          showsUserLocation={false}
                          showsMyLocationButton={false}
                          scrollEnabled={true}
                          zoomEnabled={true}
                        >
                          <Marker coordinate={coordinates} title={employerData.companyName} />
                        </MapView>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Feedback Section */}
            <FeedbackSection
              accountId={employerId}
              feedbackType="JobSeekerToEmployer"
              title="Đánh giá từ người tìm việc"
              isEmployer={true}
            />
          </>
        ) : (
          <View style={styles.jobsSection}>
            <Text style={styles.comingSoonText}>Tin tuyển dụng sẽ được hiển thị ở đây</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2558B6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2558B6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2558B6',
    fontWeight: '600',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 8,
  },
  benefitsContainer: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  mapContainer: {
    marginTop: 8,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mapWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  jobsSection: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default EmployerProfile; 