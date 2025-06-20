import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";
import * as Location from 'expo-location';

class JobPostService {

    static async searchJobPosts({
        companyName,
        jobName,
        salaryFrom,
        salaryTo,
        jobTimeFrom,
        jobTimeTo,
        salaryUnit,
        districtCodeList,
        jobPositionId,
        pageIndex,
        pageSize
    } = {}) {
        try {
            
            const params = new URLSearchParams();
            
            if (companyName) params.append('companyName', companyName);
            if (jobName) params.append('jobName', jobName);
            if (salaryFrom) params.append('salaryFrom', salaryFrom);
            if (salaryTo) params.append('salaryTo', salaryTo);
            if (jobTimeFrom) params.append('jobTimeFrom', jobTimeFrom);
            if (jobTimeTo) params.append('jobTimeTo', jobTimeTo);
            if (salaryUnit) params.append('salaryUnit', salaryUnit);
            if (jobPositionId) params.append('jobPositionId', jobPositionId);
            if (districtCodeList && Array.isArray(districtCodeList) && districtCodeList.length > 0) {
                params.append('districtCodeList', districtCodeList.join(','));
            }
            if (pageIndex) params.append('pageIndex', pageIndex);
            if (pageSize) params.append('pageSize', pageSize);
            const response = await api.get(`job-posts/search?${params.toString()}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || "Đã xảy ra lỗi khi tìm kiếm công việc.",
                status: error.response?.status
            };
        }
    }

    // Helper method to get current location
    static async getCurrentLocation() {
       
        try {
             const userId = await AsyncStorage.getItem('userId');
                        console.log('User ID:', userId);
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                console.warn('Location permission not granted, fetching from JobSeeker API');
                // Get jobSeekerId from storage or context (you'll need to pass this as parameter)
                // For now, we'll need to modify this method to accept jobSeekerId
                return await this.getJobSeekerLocationFallback(userId);
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });

            // Check if coordinates are within Vietnam bounds
            const isInVietnam = this.isLocationInVietnam(location.coords.latitude, location.coords.longitude);
            
            if (!isInVietnam) {
                console.warn('Location is outside Vietnam, fetching from JobSeeker API');
                return await this.getJobSeekerLocationFallback(userId);
            }

            // Reverse geocode to get address
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                
                // Double check if the country is Vietnam
                if (address.country && !this.isVietnamCountry(address.country)) {
                    console.warn('Reverse geocoded country is not Vietnam:', address.country);
                    return await this.getJobSeekerLocationFallback(userId);
                }
                
                // Format Vietnamese address
                const formattedAddress = [
                    address.streetNumber,
                    address.street,
                    address.district,
                    address.city || address.region,
                ].filter(Boolean).join(', ');
                console.log('Current location (Vietnam):', formattedAddress, 'userId:', userId);
                return formattedAddress || await this.getJobSeekerLocationFallback(userId);
            }

            return await this.getJobSeekerLocationFallback();
        } catch (error) {
            console.error('Error getting current location:', error);
            return await this.getJobSeekerLocationFallback();
        }
    }

    // Helper method to get JobSeeker location as fallback
    static async getJobSeekerLocationFallback(jobSeekerId) {
        try {
            // If jobSeekerId is not provided, we need to get it from storage/context
            // This is a temporary solution - you should pass jobSeekerId as parameter
            if (!jobSeekerId) {
                // You'll need to implement getting jobSeekerId from AsyncStorage or context
                console.warn('No jobSeekerId provided for location fallback, using default location');
                return 'S205 Vinhome Grand Park, Quận 9, Thành phố Hồ Chí Minh';
            }

            const JobSeekerService = require('../JobSeekerService/JobSeekerService').default;
            const result = await JobSeekerService.getJobSeekerLocation(jobSeekerId);
            
            if (result.success && result.data) {
                console.log('Using JobSeeker location:', result.data);
                return result.data;
            } else {
                console.warn('Failed to get JobSeeker location:', result.error);
                return 'S205 Vinhome Grand Park, Quận 9, Thành phố Hồ Chí Minh';
            }
        } catch (error) {
            console.error('Error getting JobSeeker location:', error);
            return 'S205 Vinhome Grand Park, Quận 9, Thành phố Hồ Chí Minh';
        }
    }

    // Updated getRecommendedJobPosts method to pass jobSeekerId to getCurrentLocation
    static async getRecommendedJobPosts(jobSeekerId, options = {}) {
        try {
            // jobSeekerId is required
            if (!jobSeekerId) {
                throw new Error('jobSeekerId is required');
            }

            // Get current location or use provided location
            let currentLocation = options.currentLocation;
            
            if (!currentLocation) {
                console.log('Getting current location...');
                // Pass jobSeekerId to getCurrentLocation for fallback
                currentLocation = await this.getCurrentLocationWithFallback(jobSeekerId);
            }

            const {
                pageIndex = 0,
                pageSize = 20,
                includeScheduleMatching = true,
                includeDistanceCalculation = true
            } = options;

            const params = new URLSearchParams();
            
            if (currentLocation) params.append('currentLocation', currentLocation);
            if (pageIndex !== undefined) params.append('pageIndex', pageIndex);
            if (pageSize !== undefined) params.append('pageSize', pageSize);
            if (includeScheduleMatching !== undefined) params.append('includeScheduleMatching', includeScheduleMatching);
            if (includeDistanceCalculation !== undefined) params.append('includeDistanceCalculation', includeDistanceCalculation);

            console.log('Recommendation API URL:', `job-posts/recommendations/${jobSeekerId}?${params.toString()}`);
            console.log('Using location:', currentLocation);
            
            const response = await api.get(`job-posts/recommendations/${jobSeekerId}?${params.toString()}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        }
        catch (error) {
            console.error('Error in getRecommendedJobPosts:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy công việc gợi ý.",
                status: error.response?.status
            };
        }
    }

    // New method that accepts jobSeekerId for location fallback
    static async getCurrentLocationWithFallback(jobSeekerId) {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                console.warn('Location permission not granted, fetching from JobSeeker API');
                return await this.getJobSeekerLocationFallback(jobSeekerId);
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });

            // Check if coordinates are within Vietnam bounds
            const isInVietnam = this.isLocationInVietnam(location.coords.latitude, location.coords.longitude);
            
            if (!isInVietnam) {
                console.warn('Location is outside Vietnam, fetching from JobSeeker API');
                return await this.getJobSeekerLocationFallback(jobSeekerId);
            }

            // Reverse geocode to get address
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                
                // Double check if the country is Vietnam
                if (address.country && !this.isVietnamCountry(address.country)) {
                    console.warn('Reverse geocoded country is not Vietnam:', address.country);
                    return await this.getJobSeekerLocationFallback(jobSeekerId);
                }
                
                // Format Vietnamese address
                const formattedAddress = [
                    address.streetNumber,
                    address.street,
                    address.district,
                    address.city || address.region,
                ].filter(Boolean).join(', ');
                
                console.log('Current location (Vietnam):', formattedAddress, 'userId:', jobSeekerId);
                return formattedAddress || await this.getJobSeekerLocationFallback(jobSeekerId);
            }

            return await this.getJobSeekerLocationFallback(jobSeekerId);
        } catch (error) {
            console.error('Error getting current location:', error);
            return await this.getJobSeekerLocationFallback(jobSeekerId);
        }
    }

    // Helper method to check if coordinates are within Vietnam bounds
    static isLocationInVietnam(latitude, longitude) {
        // Vietnam approximate geographic bounds
        const vietnamBounds = {
            north: 23.393395,  // Northernmost point (near China border)
            south: 8.179767,   // Southernmost point (Ca Mau)
            east: 109.464638,  // Easternmost point (including islands)
            west: 102.144906   // Westernmost point (near Laos border)
        };
        
        return (
            latitude >= vietnamBounds.south &&
            latitude <= vietnamBounds.north &&
            longitude >= vietnamBounds.west &&
            longitude <= vietnamBounds.east
        );
    }

    // Helper method to check if country name indicates Vietnam
    static isVietnamCountry(country) {
        const vietnamNames = [
            'Vietnam',
            'Viet Nam', 
            'VN',
            'VNM',
            'Socialist Republic of Vietnam',
            'Cộng hòa Xã hội chủ nghĩa Việt Nam',
            'Việt Nam'
        ];
        
        return vietnamNames.some(name => 
            country.toLowerCase().includes(name.toLowerCase())
        );
    }

    // Updated method to use expo-location
    static async getRecommendedJobPosts(jobSeekerId, options = {}) {
        try {
            // jobSeekerId is required
            if (!jobSeekerId) {
                throw new Error('jobSeekerId is required');
            }

            // Get current location or use provided location
            let currentLocation = options.currentLocation;
            
            if (!currentLocation) {
                console.log('Getting current location...');
                // Pass jobSeekerId to getCurrentLocation for fallback
                currentLocation = await this.getCurrentLocationWithFallback(jobSeekerId);
            }

            const {
                pageIndex = 0,
                pageSize = 20,
                includeScheduleMatching = true,
                includeDistanceCalculation = true
            } = options;

            const params = new URLSearchParams();
            
            if (currentLocation) params.append('currentLocation', currentLocation);
            if (pageIndex !== undefined) params.append('pageIndex', pageIndex);
            if (pageSize !== undefined) params.append('pageSize', pageSize);
            if (includeScheduleMatching !== undefined) params.append('includeScheduleMatching', includeScheduleMatching);
            if (includeDistanceCalculation !== undefined) params.append('includeDistanceCalculation', includeDistanceCalculation);

            console.log('Recommendation API URL:', `job-posts/recommendations/${jobSeekerId}?${params.toString()}`);
            console.log('Using location:', currentLocation);
            
            const response = await api.get(`job-posts/recommendations/${jobSeekerId}?${params.toString()}`);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        }
        catch (error) {
            console.error('Error in getRecommendedJobPosts:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lấy công việc gợi ý.",
                status: error.response?.status
            };
        }
    }
}

export default JobPostService;