import { View, StyleSheet, Image, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import mainBg from "../assets/main-bg.png";
import { useLoading } from "../context/LoadingContext";
import LoadingComponent from "../components/Common/LoadingComponent";
import IonIcons from "@expo/vector-icons/Ionicons";

export default function HeaderLayout({ children, title , showBackButton = true }) {
  const { isLoading } = useLoading();
  const navigation = useNavigation();

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
            loadingText="Đang tải thông tin công việc..."
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
      <View>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            {showBackButton && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <IonIcons
                  name="arrow-back-outline"
                  size={25}
                  color="white"
                />
              </TouchableOpacity>
            )}
            <Text style={styles.headerText}>{title}</Text>
            {/* Spacer to center the title when back button is present */}
            {showBackButton && <View style={styles.spacer} />}
          </View>
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
    paddingHorizontal: "3%",
    paddingVertical: "5%",

  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  backButton: {

  },
  headerText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 20,
  },
  spacer: {
    width: 45, 
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
  formContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F7FF",
    padding: 20,
  },
});
