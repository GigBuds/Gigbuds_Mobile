import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";
import SearchBar from "../../components/SearchBar/SearchBar";
import JobCard from "../../components/JobCard/JobCard";
import AdBanner from "../../components/AdBanner/AdBanner";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
  const navigation = useNavigation();

  // Clear all filter storage when home screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const clearFilterStorage = async () => {
        try {
          await AsyncStorage.multiRemove([
            "salaryFilter",
            "locationFilter",
            "experienceFilter",
            "searchParams",
          ]);
          console.log("Cleared all filter storage on home screen focus");
        } catch (error) {
          console.error("Error clearing filter storage:", error);
        }
      };

      clearFilterStorage();
    }, [])
  );

  return (
    <View>
      <AdBanner />
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
      <JobCard marginBottom={250} />
    </View>
  );
};

export default HomeScreen;
