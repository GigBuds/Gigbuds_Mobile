import React from "react";
import { View, StyleSheet, ImageBackground, Image, Text } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Badge } from "react-native-paper";
export default function UserLayout({ children }) {
  return (
    // Use ImageBackground for an image, or View for a color
    // <ImageBackground source={require("../assets/bg.png")} style={styles.background}>
    <View style={styles.container}>
      <Image
        source={mainBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.headerContainer}>
        <Image source={logo} resizeMode="center" style={styles.logo} />
        <View
          style={{
            flexDirection: "column",
            marginLeft: 10,
            width: "63%",
          }}
        >
          <Text style={{ fontSize: 18, color: "white" }}>Xin chào, </Text>
          <Text style={styles.headerText}>Nguyen Quang Giap</Text>
        </View>
        <View style={{ width: "20%", alignItems: "center", position: "relative" }}>
        <Badge style={{left:39, top: -8, position:'absolute', zIndex: 1}}>
            2
        </Badge>
          <Ionicons
            name="notifications"
            size={30}
            color={"white"}
          />
        </View>
      </View>
      <View style={styles.formContainer}>{children}</View>
    </View>
    // </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  headerContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    height: "15%",
    flexDirection: "row",
    paddingHorizontal: "3%",
    paddingVertical: "5%",
  },
  logo: {
    backgroundColor: "black",
    borderRadius: 50,
    height: "100%",
    width: "18%",
  },
  headerText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  formContainer: {
    width: "100%",
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F3F7FF",
    padding: 12,
  },
});
