import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Notification from "../components/Common/Notification";
import { Host } from "react-native-portalize";

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
    <Host>
      {/* portal container, use for notification */}
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
            <Text style={styles.headerText}>{userName || "Người dùng"}</Text>
          </View>
          <Notification style={{ position: "absolute", right: 0 }} />
        </View>
        <View style={styles.formContainer}>{children}</View>
      </View>
    </Host>
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
