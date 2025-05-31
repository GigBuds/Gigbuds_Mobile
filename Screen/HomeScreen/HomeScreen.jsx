import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import SearchBar from "../../components/SearchBar/SearchBar";
import JobCard from "../../components/JobCard/JobCard";
import AdBanner from "../../components/AdBanner/AdBanner";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const navigation = useNavigation();
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
              screen: 'Tìm Kiếm',
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

      <JobCard />
    </View>
  );
};

export default HomeScreen;
