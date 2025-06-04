import { View, Text, TextInput } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
const SearchBar = ({setSearchInput}) => {
  const handleOnchangeText = (event) => {
    const text = event.nativeEvent.text;
    setSearchInput(text);
    console.log("Search input changed:", text);
  };
  return (
    <View>
      <TextInput
        // Placeholder text
        style={{
          height: 40,
          borderColor: "gray",
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 40,
          margin: 10,
          backgroundColor: "white",
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        onChange={handleOnchangeText}
      />
      <Ionicons
        name="search"
        size={20}
        color="gray"
        style={{
          position: "absolute",
          left: 20,
          top: 20,
        }}
        onPress={() => {
          console.log("Search query:", event.nativeEvent.text);
          // Handle search logic here
        }}
      />
    </View>
  );
};

export default SearchBar;
