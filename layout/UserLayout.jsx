import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function UserLayout({ children }) {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUserName = await AsyncStorage.getItem("userName");
        console.log("Stored User Name:", storedUserName);
        if (storedUserName !== null) {
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

      fetchUserName();
  }, []);

  return (
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
          <Text style={styles.headerText}>
            {userName || "Người dùng"}
          </Text>
        </View>
        <View style={{ width: "20%", alignItems: "center", position: "relative" }}>
          <Badge style={{left: 39, top: -8, position: 'absolute', zIndex: 1}}>
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
