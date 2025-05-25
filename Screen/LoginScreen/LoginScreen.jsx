import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import mainBg from "../../assets/main-bg.png";
import logo from "../../assets/logo-whitetext.png";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

const LoginScreen = () => {
  const navigation = useNavigation();

  const navigateToJobSeekerLogin = () => {
    navigation.navigate('loginforJS');
  };

  const navigateToEmployerLogin = () => {
    navigation.navigate('loginforemployer');
  };

  return (
    <View style={styles.container}>
      <Image
        source={mainBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.logoContainer}>
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="center"
        />
      </View>
      <View style={styles.buttonSectionContainer}>
        <Text style={styles.questionText}>
          Bạn là người tìm việc hay nhà tuyển dụng?
        </Text>
        <TouchableOpacity style={styles.touchableOpacity} onPress={navigateToJobSeekerLogin}>
          <Button
            style={styles.jobSeekerButton}
            labelStyle={styles.jobSeekerButtonLabel}
          >
            Tôi là người tìm việc
          </Button>
        </TouchableOpacity>

        <TouchableOpacity style={styles.touchableOpacity} onPress={navigateToEmployerLogin}>
          <Button
            style={styles.employerButton}
            labelStyle={styles.employerButtonLabel}
          >
            Tôi là nhà tuyển dụng
          </Button>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    height: "50%",
    justifyContent: "center",
    paddingTop: "20%",
  },
  logo: {
    width: "30%",
    height: "50%",
  },
  buttonSectionContainer: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    height: "50%",
    justifyContent: "flex-end",
    paddingBottom: "45%",
  },
  questionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  touchableOpacity: {
    width: '80%',
  },
  jobSeekerButton: {
    backgroundColor: "#FF7345",
    marginBottom: '5%',
    borderRadius: 8,
    paddingVertical: '1%',
  },
  jobSeekerButtonLabel: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  employerButton: {
    backgroundColor: "white",
    paddingVertical: '1%',
    borderRadius: 8,
  },
  employerButtonLabel: {
    color: "#FF7345",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default LoginScreen;
