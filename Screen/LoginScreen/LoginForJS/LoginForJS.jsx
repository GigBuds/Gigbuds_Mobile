import { View, Text, Image, StyleSheet } from "react-native";
import React, { useState } from "react";
import logo from "../../../assets/logo.png";
import mainBg from "../../../assets/main-bg.png";
import { SegmentedButtons } from "react-native-paper";
import LoginSection from "./LoginSection";
import RegisterSecion from "./RegisterSecion";
const LoginForJS = () => {
  const [value, setValue] = useState("Đăng nhập");
  return (
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
        <Text style={styles.introTitle}>Bắt đầu ngay</Text>
        <Text style={styles.introSubtitle}>
          Đăng nhập hoặc tạo tài khoản để khám phá những công việc hấp dẫn ngay
          hôm nay!
        </Text>
      </View>
      <View style={styles.formContainer}>
        <SegmentedButtons
          value={value}
          style={styles.segmentedButtonsContainer}
          onValueChange={setValue}
          buttons={[
            {
              value: "Đăng nhập",
              label: "Đăng nhập",
              checkedColor: "black",
              uncheckedColor: "black",
              style:
                value === "Đăng nhập"
                  ? styles.activeButton
                  : styles.inactiveButton,
            },
            {
              value: "Tạo tài khoản",
              label: "Tạo tài khoản",
              checkedColor: "black",
              uncheckedColor: "black",
              style:
                value === "Tạo tài khoản"
                  ? styles.activeButton
                  : styles.inactiveButton,
            },
          ]}
        />
      <View style={styles.contentContainer}>
        {value === "Đăng nhập" ? (
          <LoginSection />
        ) : (
          <RegisterSecion />
        )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    alignItems: "center",
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
  segmentedButtonsContainer: {
    marginTop: 20,
    width: "100%",
    alignSelf: "center",
    height: "8%",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "white",
  },
  inactiveButton: {
    backgroundColor: "#d3d3d3",
  },
  contentContainer: {
    paddingTop: 24,
    height: "100%",
    width: "100%"
  }
});

export default LoginForJS;
