import React from "react";
import { View, StyleSheet, ImageBackground, Image, Text } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Badge } from "react-native-paper";
export default function LoginLayout({ children , introTitle, introSubtitle}) {
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
              <Text style={styles.headerText}>GigBuds</Text>
            </View>
            <View style={styles.introContainer}>
              <Text style={styles.introTitle}>{introTitle}</Text>
              <Text style={styles.introSubtitle}>
                {introSubtitle}
              </Text>
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
    height: "10%",
    flexDirection: "row",
  },
  logo: {},
  headerText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  introContainer: {
    width: "100%",
    height: "15%",
    flexDirection: "column",
  },
  introTitle: {
    paddingLeft: "5%",
    fontSize: 35,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
  },
  introSubtitle: {
    paddingLeft: "5%",
    fontSize: 14,
    width: "80%",
    color: "white",
    textAlign: "left",
    marginTop: 10,
  },
 formContainer: {
    width: "100%",
    height: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F3F7FF",
    paddingHorizontal: "6%",
    paddingTop: 15,
  },
});
