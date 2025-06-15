import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationAsync } from "../utils/registerForPushNotificationAsync";
import NotificationService from "../Services/NotificationService/NotificationService";
import { SignalRCallbackExtensions } from "../Services/SignalRService/signalRCallbackExtensions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const PushNotificationProvider = ({ children }) => {
  // States and refs
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [pushNotification, setPushNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isDeviceTokenRegistered, setIsDeviceTokenRegistered] = useState(false);
  const [error, setError] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    console.log("🔔 Notification Provider");

    /**
     * Retrieves and processes notifications from both stored and missed sources
     * Combines notifications, sorts them by timestamp, and stores the 10 most recent ones
     * Updates the notifications state with the processed list
     * @returns {Promise<void>}
     */
    const getNotifications = async () => {
      // await AsyncStorage.clear();
      console.log("🔔 Get notifications");
      const storedNotifications =
        await SignalRCallbackExtensions.LoadStoredNotificationsAsync();
      const missedNotifications =
        await SignalRCallbackExtensions.FetchMissedNotificationsAsync();

      const allNotifications = [...storedNotifications, ...missedNotifications];

      allNotifications.sort((a, b) => b.timestamp - a.timestamp);
      const slicedNotifications = allNotifications.slice(0, 10);
      await AsyncStorage.setItem(
        "notifications",
        JSON.stringify(slicedNotifications)
      );
      console.log("🔔 Set notifications: ", slicedNotifications);
      setNotifications(slicedNotifications);
    };

    const tryGetDeviceToken = async () => {
      return await NotificationService.getDeviceToken();
    };

    tryGetDeviceToken().then((token) => {
      console.log("🔔 Token: ", token);
      if (token) {
        setExpoPushToken(token);
        setIsDeviceTokenRegistered(true);
      } else {
        console.log("🔔 No existing device token found, generating new one");
        registerForPushNotificationAsync().then(
          (token) => setExpoPushToken(token.data),
          (error) => setError(error)
        );
      }
    });
    getNotifications().then(() => {
      console.log("🔔 Notifications: ", notifications);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setPushNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "🔔 Notification Response: ",
          JSON.stringify(response, null, 2),
          JSON.stringify(response.notification.request.content.data, null, 2)
        );
        // TODO: Handle the notification response here
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  //TODO: get latest notifications here

  return (
    <NotificationContext.Provider
      value={useMemo(
        () => ({
          expoPushToken,
          pushNotification,
          notifications,
          error,
          isDeviceTokenRegistered,
          setNotifications,
        }),
        [
          expoPushToken,
          pushNotification,
          error,
          isDeviceTokenRegistered,
          notifications,
          setNotifications,
        ]
      )}
    >
      {children}
    </NotificationContext.Provider>
  );
};
