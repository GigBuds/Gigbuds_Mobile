import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import SearchBar from "../../components/SearchBar/SearchBar";
import JobCard from "../../components/JobCard/JobCard";
import AdBanner from "../../components/AdBanner/AdBanner";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchInput, setSearchInput] = React.useState("");
  const [searchParams, setSearchParams] = React.useState({});

   useFocusEffect(
      React.useCallback(() => {
        setSearchParams({});
        console.log("HomeScreen: Resetting searchParams");
      }, [])
    );

  return (
    <View>
      <AdBanner />
      
      {/* Test Payment Button */}
      <TouchableOpacity
        style={styles.paymentTestButton}
        onPress={() =>
          navigation.navigate("MembershipRegister")
        }
      >
        <Ionicons name="card" size={20} color="white" />
        <Text style={styles.paymentTestButtonText}>Test Payment Flow</Text>
      </TouchableOpacity>

      {/* Add Deep Link Test Button */}
      <TouchableOpacity
        style={[styles.paymentTestButton, { backgroundColor: '#28a745' }]}
        onPress={() =>
          navigation.navigate("PaymentResult", {
            status: "PAID",
            orderCode: "413982193"
          })
        }
      >
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.paymentTestButtonText}>Test Payment Result</Text>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 20,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Công việc nổi bật
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("MainApp", {
              screen: "Tìm Kiếm",
            })
          }
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
              color: "#FF7345",
            }}
          >
            Xem thêm {">"}
          </Text>
        </TouchableOpacity>
      </View>
      <JobCard searchInput={searchInput} searchParams={searchParams} marginBottom={-170} />
    </View>
  );
};

const styles = StyleSheet.create({
  paymentTestButton: {
    backgroundColor: '#FF7345',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  paymentTestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HomeScreen;
