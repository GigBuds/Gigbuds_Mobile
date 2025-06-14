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
      const storedNotifications = await AsyncStorage.getItem("notifications");
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Convert timestamp strings back to Date objects
        const notifications = parsed.map((notif) => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
        }));
        console.log("Loaded stored notifications:", notifications);
        return notifications;
      }
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
