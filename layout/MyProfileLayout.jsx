import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function MyProfileLayout({ children }) {
    const navigatetion = useNavigation();
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
      <View style={styles.formContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  headerContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "30%",
    flexDirection: "column",
    paddingHorizontal: "3%",
    paddingVertical: "5%",
  },
  logo: {
    backgroundColor: "black",
    position: "absolute",
    top: 20,
    zIndex: 1,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "white",
    height: "20%",
    width: "36%",
  },
  headerText: {
    fontSize: 25,
    color: "white",
    fontWeight: "bold",
    marginTop: 15,
  },
  formContainer: {
    width: "100%",
    height: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F3F7FF",
    padding: 20,
  },
});
