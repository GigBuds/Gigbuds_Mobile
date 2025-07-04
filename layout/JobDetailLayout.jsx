import { View, StyleSheet, Image, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import mainBg from "../assets/main-bg.png";

import { useLoading } from "../context/LoadingContext";
import LoadingComponent from "../components/Common/LoadingComponent";

export default function JobDetailLayout({ children, showBackButton = true, onBackPress }) {
  const { isLoading } = useLoading();
  const navigation = useNavigation();

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
