import NotificationService from "../NotificationService/NotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class SignalRCallbackExtensions {
  static async FetchMissedNotificationsAsync() {
    const notifications = await NotificationService.getMissedNotifications();
    console.log("Fetched missed notifications:", notifications);
    return notifications;
  }

  static async LoadStoredNotificationsAsync() {
    try {
      const storedNotifications = JSON.parse(
        await AsyncStorage.getItem("notifications")
      );
      if (storedNotifications) {
        console.log("Loaded stored notifications:", storedNotifications);
        return storedNotifications;
      }
      console.log("No stored notifications found");
      return [];
    } catch (error) {
      console.error("Failed to load stored notifications:", error);
      return [];
    }
  }

  static async SaveNotificationsAsync(notifications) {
    try {
      await AsyncStorage.setItem(
        "notifications",
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }
}
