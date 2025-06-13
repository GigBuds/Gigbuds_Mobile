import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Register device for push notifications
export async function registerForPushNotificationAsync() {
  // Only for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH, // Set the importance of the channel, the higher the performance, the more annoying the notification will be https://developer.android.com/develop/ui/views/notifications/channels#importance
      vibrationPattern: [0, 250, 250, 250], // Vibrate pattern
      lightColor: "#FF231F7C", // Color of the light when the notification is displayed
    });
  }

  // Check if the device is a real device
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      if (finalStatus !== "granted") {
        alert("Failed to get push notification permission");
        return;
      }
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error("Project ID is not set");
    }
    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/register-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token.data,
            userId,
          }),
        }
      );
    } catch (error) {
      console.error("Error registering device for push notifications", error);
    }
  } else {
    alert("Push notifications are not supported on this device");
  }
}
