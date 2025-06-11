import React from "react";
import { View, StyleSheet, ImageBackground, Image, Text, SafeAreaView } from "react-native";
import mainBg from "../assets/main-bg.png";
import logo from "../assets/logo.png";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Badge } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useLoading } from "../context/LoadingContext";
import LoadingComponent from "../components/Common/LoadingComponent";
export default function FilterLayout({ children, page }) {
  const navigation = useNavigation();
    const { showLoading, isLoading, hideLoading } = useLoading();

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
            loadingText="Đang tải thông tin ..."
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
      <View style={styles.headerContainer}>
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "35%",
              alignItems: "flex-start",
              borderRadius: 50,
              height: "100%",
            }}
          >
            <Ionicons
              name="close-outline"
              size={35}
              color="white"
              style={{ marginLeft: 10 }}
              onPress={() => {
                navigation.goBack();
              }}
            />
          </View>
          <View
            style={{
              width: "65%",
              height: "100%",
            }}
          >
            <Text style={styles.headerText}>{page}</Text>
          </View>
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
    height: "10%",
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
    fontSize: 22,
    color: "white",
    fontWeight: "bold",
  },
  formContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F3F7FF",
    padding: 12,
  },
});
