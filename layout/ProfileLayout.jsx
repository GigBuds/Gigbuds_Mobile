import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity, SafeAreaView } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLoading } from "../context/LoadingContext";
import LoadingComponent from "../components/Common/LoadingComponent";

export default function ProfileLayout({ children, showBackButton = true, onBackPress }) {
  const navigation = useNavigation();
  const [userName, setUserName] = useState("");
  const { isLoading } = useLoading();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const storedUserName = await AsyncStorage.getItem("userName");
        if (storedUserName !== null) {
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserName();
  }, []);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <SafeAreaView
          style={{
            zIndex: 1000,
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          <LoadingComponent
            size={80}
            speed={2000}
            showText={true}
            loadingText="Đang tải thông tin profile..."
            animationType="outline"
            strokeWidth={2.5}
          />
        </SafeAreaView>
      )}
      
      <Image
        source={mainBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Back Button */}
      {showBackButton && (
        <SafeAreaView style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      )}
      
      <View style={styles.headerContainer}>
        <Image source={logo} resizeMode="center" style={styles.logo} />
        <Text style={styles.headerText}>{userName || "Người dùng"}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("MyProfile")}
          style={styles.profileButton}
        >
          <Text style={styles.profileButtonText}>
            Xem hồ sơ 
          </Text>
          <Ionicons name="chevron-forward-outline" size={16} color="#FF7345" />
        </TouchableOpacity>
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
  backButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "white",
    height: "60%",
    width: "30%",
  },
  headerText: {
    fontSize: 25,
    color: "white",
    fontWeight: "bold",
    marginTop: 15,
  },
  profileButton: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  profileButtonText: {
    color: "#FF7345",
    fontSize: 16,
  },
  formContainer: {
    width: "100%",
    height: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F3F7FF",
    padding: 20,
  },
});
