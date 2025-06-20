import * as Location from "expo-location";
import { Alert, Platform } from "react-native";
import * as Linking from "expo-linking";

class LocationService {
  static permissionStatus = null;
  static fallbackLocation =
    "S205 Vinhome Grand Park, Quận 9, Thành phố Hồ Chí Minh";
  static lastKnownLocation = null;
  static locationCache = null;
  static cacheExpiry = null;
  static hasShownServicesAlert = false;

  /**
   * Check and request location permission with proper error handling
   * @param {boolean} showAlert - Whether to show alert if permission denied
   * @returns {Promise<boolean>} - Whether permission is granted
   */
  static async checkAndRequestPermission(showAlert = false) {
    try {
      console.log("🗺️ Checking location permissions...");

      // First check current permission status
      const { status: currentStatus } =
        await Location.getForegroundPermissionsAsync();

      if (currentStatus === "granted") {
        console.log("🗺️ Location permission already granted");
        this.permissionStatus = "granted";
        return true;
      }

      // Request permission if not granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissionStatus = status;

      if (status === "granted") {
        console.log("🗺️ Location permission granted");
        return true;
      } else {
        console.log("🗺️ Location permission denied, using fallback location");

        if (showAlert) {
          this.showPermissionAlert();
        }

        return false;
      }
    } catch (error) {
      console.error("🗺️ Error checking location permission:", error);
      this.permissionStatus = "error";
      return false;
    }
  }

  /**
   * Check if location services are enabled on the device
   * @returns {Promise<boolean>}
   */
  static async isLocationServicesEnabled() {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      console.log(`🗺️ Location services enabled: ${enabled}`);
      return enabled;
    } catch (error) {
      console.error("🗺️ Error checking location services:", error);
      return false;
    }
  }

  /**
   * Show user-friendly permission alert
   */
  static showPermissionAlert() {
    Alert.alert(
      "Vị trí",
      "Ứng dụng sẽ hoạt động tốt hơn nếu bạn cho phép truy cập vị trí để tìm công việc gần bạn. Bạn có thể bật tính năng này trong Cài đặt sau.",
      [
        { text: "Để sau", style: "cancel" },
        {
          text: "Cài đặt",
          onPress: () => {
            if (Platform.OS === "android") {
              Linking.openSettings();
            } else {
              // For iOS, we can only guide users to settings
              Alert.alert(
                "Hướng dẫn",
                "Vào Cài đặt > GigBuds > Vị trí để bật quyền truy cập vị trí.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  }

  /**
   * Show location services disabled alert
   */
  static showLocationServicesAlert() {
    const message =
      Platform.OS === "android"
        ? "Dịch vụ định vị bị tắt. Vào Cài đặt > Vị trí để bật dịch vụ định vị."
        : "Dịch vụ định vị bị tắt. Vào Cài đặt > Quyền riêng tư & Bảo mật > Dịch vụ định vị để bật.";

    Alert.alert("Dịch vụ định vị bị tắt", message, [
      { text: "Để sau", style: "cancel" },
      {
        text: "Cài đặt",
        onPress: () => {
          Linking.openSettings();
        },
      },
    ]);
  }

  /**
   * Get current location with fallback and caching
   * @param {Object} options - Location options
   * @returns {Promise<string>} - Current location address or fallback
   */
  static async getCurrentLocation(options = {}) {
    try {
      // Check cache first
      const now = Date.now();
      if (this.locationCache && this.cacheExpiry && now < this.cacheExpiry) {
        console.log("🗺️ Using cached location:", this.locationCache);
        return this.locationCache;
      }

      // Check permission first
      const hasPermission = await this.checkAndRequestPermission();

      if (!hasPermission) {
        console.log("🗺️ Using fallback location (no permission)");
        return this.fallbackLocation;
      }

      // Check if location services are enabled - enhanced check
      let servicesEnabled = false;
      try {
        servicesEnabled = await this.isLocationServicesEnabled();
        console.log(`🗺️ Location services check result: ${servicesEnabled}`);
      } catch (servicesError) {
        console.log("🗺️ Could not check location services, assuming disabled");
        servicesEnabled = false;
      }

      if (!servicesEnabled) {
        console.log("🗺️ Location services disabled, using fallback location");

        // Show alert only once per session
        if (!this.hasShownServicesAlert) {
          setTimeout(() => {
            this.showLocationServicesAlert();
          }, 1000);
          this.hasShownServicesAlert = true;
        }

        return this.fallbackLocation;
      }

      const {
        accuracy = Location.Accuracy.Balanced,
        timeout = 8000, // Reduced timeout
        maximumAge = 300000, // 5 minutes cache
      } = options;

      console.log("🗺️ Attempting to get current position...");

      // Get current position with enhanced timeout and error handling
      let location;
      try {
        location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy,
            timeout,
            maximumAge,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Location timeout")),
              timeout + 1000
            )
          ),
        ]);
      } catch (locationError) {
        // Handle specific location errors
        const errorMessage = locationError.message.toLowerCase();

        if (
          errorMessage.includes("location services") ||
          errorMessage.includes("location is unavailable") ||
          errorMessage.includes("location service")
        ) {
          console.log(
            "🗺️ Location services are disabled at system level, using fallback"
          );

          // Show services alert if not shown yet
          if (!this.hasShownServicesAlert) {
            setTimeout(() => {
              this.showLocationServicesAlert();
            }, 1000);
            this.hasShownServicesAlert = true;
          }

          return this.fallbackLocation;
        }

        // For other errors, just log and use fallback
        console.log("🗺️ Location fetch failed, using fallback:", errorMessage);
        return this.fallbackLocation;
      }

      console.log("🗺️ Got location coordinates:", {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      // Reverse geocode to get address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          // Format Vietnamese address
          const formattedAddress = [
            address.streetNumber,
            address.street,
            address.district,
            address.city || address.region,
          ]
            .filter(Boolean)
            .join(", ");

          const finalAddress = formattedAddress || this.fallbackLocation;

          // Cache the result
          this.locationCache = finalAddress;
          this.cacheExpiry = now + (options.cacheTime || 300000); // 5 minutes default
          this.lastKnownLocation = finalAddress;

          console.log("🗺️ Current location:", finalAddress);
          return finalAddress;
        }
      } catch (geocodeError) {
        console.log(
          "🗺️ Reverse geocoding failed, using coordinates as fallback"
        );
        // Still cache coordinates-based location
        const coordsLocation = `${location.coords.latitude}, ${location.coords.longitude}`;
        this.locationCache = coordsLocation;
        this.cacheExpiry = now + (options.cacheTime || 300000);
        this.lastKnownLocation = coordsLocation;
        return coordsLocation;
      }

      console.log("🗺️ No reverse geocode results, using fallback");
      return this.fallbackLocation;
    } catch (error) {
      // Suppress error logging to avoid console spam
      console.log("🗺️ Using fallback location due to error");

      // Return last known location if available
      if (this.lastKnownLocation) {
        console.log("🗺️ Using last known location:", this.lastKnownLocation);
        return this.lastKnownLocation;
      }

      // Fall back to default location
      return this.fallbackLocation;
    }
  }

  /**
   * Get location coordinates with fallback
   * @param {Object} options - Location options
   * @returns {Promise<Object>} - Location coordinates or null
   */
  static async getCurrentCoordinates(options = {}) {
    try {
      // Check permission first
      const hasPermission = await this.checkAndRequestPermission();

      if (!hasPermission) {
        console.log(
          "🗺️ Location permission not available, returning null coordinates"
        );
        return null;
      }

      // Check if location services are enabled - enhanced check
      let servicesEnabled = false;
      try {
        servicesEnabled = await this.isLocationServicesEnabled();
      } catch (servicesError) {
        console.log("🗺️ Could not check location services for coordinates");
        servicesEnabled = false;
      }

      if (!servicesEnabled) {
        console.log(
          "🗺️ Location services disabled, returning null coordinates"
        );
        return null;
      }

      const {
        accuracy = Location.Accuracy.Balanced,
        timeout = 8000,
        maximumAge = 300000,
      } = options;

      // Get current position with enhanced error handling
      let location;
      try {
        location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy,
            timeout,
            maximumAge,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Location timeout")),
              timeout + 1000
            )
          ),
        ]);
      } catch (locationError) {
        // Handle specific location errors silently
        const errorMessage = locationError.message.toLowerCase();

        if (
          errorMessage.includes("location services") ||
          errorMessage.includes("location is unavailable") ||
          errorMessage.includes("location service")
        ) {
          console.log(
            "🗺️ Location services disabled at system level, returning null coordinates"
          );
          return null;
        }

        // For other errors, just return null
        console.log("🗺️ Could not get coordinates, returning null");
        return null;
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      // Suppress error logging
      console.log("🗺️ Coordinates unavailable, returning null");
      return null;
    }
  }

  /**
   * Check if location permission is granted without requesting
   * @returns {Promise<boolean>}
   */
  static async hasPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("🗺️ Error checking location permission status:", error);
      return false;
    }
  }

  /**
   * Get the fallback location
   * @returns {string}
   */
  static getFallbackLocation() {
    return this.fallbackLocation;
  }

  /**
   * Set a custom fallback location
   * @param {string} location
   */
  static setFallbackLocation(location) {
    this.fallbackLocation = location;
  }

  /**
   * Clear location cache
   */
  static clearCache() {
    this.locationCache = null;
    this.cacheExpiry = null;
    console.log("🗺️ Location cache cleared");
  }

  /**
   * Get cached location if available
   * @returns {string|null}
   */
  static getCachedLocation() {
    const now = Date.now();
    if (this.locationCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.locationCache;
    }
    return null;
  }
}

export default LocationService;
