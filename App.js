import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Navigator from "./navigation/Navigator";

export default function App() {
  return (
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
  );
}
