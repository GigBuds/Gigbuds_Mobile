import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from '@react-navigation/native';
import { LoadingProvider } from "./context/LoadingContext";
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import Navigator from "./navigation/Navigator";
import { PushNotificationProvider } from "./context/notificationContext";

const prefix = Linking.createURL('/');

export default function App() {
  const linking = {
    prefixes: [prefix, 'gigbuds://'],
    config: {
      screens: {
        PaymentResult: {
          path: 'payment-result',
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
      console.log('🔗 Deep link received:', url);
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with deep link:', url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <PushNotificationProvider>   
      <LoadingProvider>
        <NavigationContainer 
          linking={linking} 
          fallback={<Text>Loading...</Text>}
          onStateChange={(state) => {
            console.log('📱 Navigation state changed:', state);
          }}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <SafeAreaView forceInset={{ bottom: "never" }} style={{ flex: 1 }}>
                <Image
                  source={require("./assets/main-bg.png")}
                  style={{ width: "100%", height: "100%", position: "absolute" }}
                  resizeMethod="resize"
                  resizeMode="cover"
                />
                <Navigator />
              </SafeAreaView>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </NavigationContainer>
      </LoadingProvider>
    </PushNotificationProvider>

  );
}
