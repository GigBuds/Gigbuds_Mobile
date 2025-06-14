import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationAsync } from "../utils/registerForPushNotificationAsync";
import NotificationService from "../Services/NotificationService/NotificationService";

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
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [pushNotification, setPushNotification] = useState(null);
  const [error, setError] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    console.log("🔔 Notification Provider");
    let existingDeviceToken = null;
    const tryGetDeviceToken = async () => {
      const deviceId = await NotificationService.getDeviceId();
      existingDeviceToken = await NotificationService.getDeviceToken(deviceId);
    };

    tryGetDeviceToken();

    if (existingDeviceToken) {
      console.log("🔔 Existing device token found");
      setExpoPushToken(existingDeviceToken);
    } else {
      console.log("🔔 No existing device token found, generating new one");
      registerForPushNotificationAsync().then(
        (token) => setExpoPushToken(token.data),
        (error) => setError(error)
      );
    }

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

  return (
    <NotificationContext.Provider
      value={useMemo(
        () => ({ expoPushToken, pushNotification, error }),
        [expoPushToken, pushNotification, error]
      )}
    >
      {children}
    </NotificationContext.Provider>
  );
};
