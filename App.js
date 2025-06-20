import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View, Alert, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { LoadingProvider } from "./context/LoadingContext";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import Navigator from "./navigation/Navigator";
import { PushNotificationProvider } from "./context/notificationContext";
import { SignalRProvider } from "./context/SignalRProvider";
import LocationService from "./Services/LocationService/LocationService";

const prefix = Linking.createURL("/");

export default function App() {
  const linking = {
    prefixes: [prefix, "gigbuds://"],
    config: {
      screens: {
        PaymentResult: {
          path: "payment-result",
          parse: {
            status: (status) => status,
            orderCode: (orderCode) => orderCode,
          },
        },
      },
    },
  };

  // Add deep link debugging
  useEffect(() => {
    const handleDeepLink = (url) => {
      console.log("🔗 Deep link received:", url);
    };

    // Initialize location services with improved error handling
    const initializeLocationServices = async () => {
      try {
        console.log("🗺️ Initializing location services...");

        // Check if location services are enabled first
        const servicesEnabled =
          await LocationService.isLocationServicesEnabled();
        if (!servicesEnabled) {
          console.log(
            "🗺️ Location services are disabled, app will use fallback location"
          );
          return;
        }

        // Check and request permission without blocking app startup
        const hasPermission = await LocationService.checkAndRequestPermission(
          false
        );
        if (hasPermission) {
          console.log("🗺️ Location services initialized successfully");

          // Pre-cache location for better performance
          LocationService.getCurrentLocation().catch((error) => {
            console.log(
              "🗺️ Initial location fetch failed, will use fallback:",
              error.message
            );
          });
        } else {
          console.log(
            "🗺️ Location permission not granted, app will use fallback location"
          );
        }
      } catch (error) {
        console.error("🗺️ Error initializing location services:", error);
        // App continues to work normally with fallback location
      }
    };

    // Initialize location services asynchronously
    initializeLocationServices();

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🚀 App opened with deep link:", url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <LoadingProvider>
      <NavigationContainer
        linking={linking}
        fallback={<Text>Loading...</Text>}
        onStateChange={(state) => {
          console.log("📱 Navigation state changed:", state);
        }}
      >
        <PushNotificationProvider>
          <SignalRProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <SafeAreaView
                  forceInset={{ bottom: "never" }}
                  style={{ flex: 1 }}
                >
                  <Image
                    source={require("./assets/main-bg.png")}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                    }}
                    resizeMethod="resize"
                    resizeMode="cover"
                  />
                  <Navigator />
                </SafeAreaView>
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </SignalRProvider>
        </PushNotificationProvider>
      </NavigationContainer>
    </LoadingProvider>
  );
}
