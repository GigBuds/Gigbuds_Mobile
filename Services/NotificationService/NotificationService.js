import api from "../api";
import * as Device from "expo-device";
import * as Application from "expo-application";
import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";
import { Platform } from "react-native";

class NotificationService {
  static async registerPushNotification(token, userId) {
    try {
      const deviceId = await NotificationService.getDeviceId();
      console.log("🔔 Device ID from registerPushNotification", deviceId);
      const body = {
        userId: userId,
        deviceToken: token,
        deviceId: deviceId,
        deviceType: Device.osName,
        deviceName: Device.deviceName,
        deviceModel: Device.modelName,
        deviceManufacturer: Device.manufacturer,
      };
      console.log("🔔 Body from registerPushNotification", body);
      const response = await api.post(
        "/notifications/push-notifications/register",
        body
      );
      console.log("🔔 Response from registerPushNotification", response);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error registering push notification", error);
      throw error;
    }
  }

  static async getDeviceToken(userId) {
    try {
      const response = await api.get(
        `/notifications/push-notifications/device-token/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting device token", error);
      throw error;
    }
  }

  static async getDeviceId() {
    if (Platform.OS === "android") {
      return Application.getAndroidId();
    } else {
      let deviceId = await SecureStore.getItemAsync("deviceId");
      if (!deviceId) {
        deviceId = uuidv4();
        await SecureStore.setItemAsync("deviceId", deviceId);
      }
      return deviceId;
    }
  }
}

export default NotificationService;
