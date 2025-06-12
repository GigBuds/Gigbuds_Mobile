import React, { useEffect, useState } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import HomeScreen from "../Screen/HomeScreen/HomeScreen";
import text from "./text";
import MessageScreen from "../Screen/MessageScreen/MessageScreen";
import ScheduleScreen from "../Screen/ScheduleScreen/ScheduleScreen";
import ProfileScreen from "../Screen/ProfileScreen/ProfileScreen";
import SearchScreen from "../Screen/SearchScreen/SearchScreen";
import LoginScreen from "../Screen/LoginScreen/LoginScreen";
import LoginForJS from "../Screen/LoginScreen/LoginForJS/LoginForJS";

import OTPScreen from "../Screen/LoginScreen/OTPScreen/OTPScreen";
import UserLayout from "../layout/UserLayout";
import FilterBySalary from "../Screen/FilterScreen/FilterBySalary";
import FilterLayout from "../layout/FilterLayout";
import ProfileLayout from "../layout/ProfileLayout";
import MyProfile from "../Screen/ProfileScreen/MyProfile/MyProfile";
import MyProfileLayout from "../layout/MyProfileLayout";
import JobDetailScreen from "../Screen/JobDetailScreen/JobDetailScreen";
import JobDetailLayout from "../layout/JobDetailLayout";

export default function Navigator() {
  const Tab = createBottomTabNavigator();
  const Stack = createNativeStackNavigator();

  const HomeStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          options={{ headerShown: false }}
          children={() => (
            <UserLayout>
              <HomeScreen />
            </UserLayout>
          )}
        />
        <Stack.Screen
          name="JobDetail"
          options={{ headerShown: false }}
          children={() => (
            <JobDetailLayout>
              <JobDetailScreen />
            </JobDetailLayout>
          )}
        />
      </Stack.Navigator>
    );
  };

  const SearchStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Search"
          options={{ headerShown: false }}
          children={() => (
            <UserLayout>
              <SearchScreen />
            </UserLayout>
          )}
        />
        <Stack.Screen
          name="Mức Lương"
          options={{ headerShown: false }}
          children={() => (
            <FilterLayout page={"Mức Lương"}>
              <FilterBySalary />
            </FilterLayout>
          )}
        />
        <Stack.Screen
          name="JobDetail"
          options={{ headerShown: false }}
          children={() => (
            <JobDetailLayout>
              <JobDetailScreen />
            </JobDetailLayout>
          )}
        />
      </Stack.Navigator>
    );
  };

  const MessageStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Message"
          options={{ headerShown: false }}
          children={() => (
            <UserLayout>
              <MessageScreen />
            </UserLayout>
          )}
        />
      </Stack.Navigator>
    );
  };
  const ScheduleStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Schedule"
          options={{ headerShown: false }}
          children={() => (
            <UserLayout>
              <ScheduleScreen />
            </UserLayout>
          )}
        />
      </Stack.Navigator>
    );
  };

  const ProfileStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Profile"
          options={{ headerShown: false }}
          children={() => (
            <ProfileLayout>
              <ProfileScreen />
            </ProfileLayout>
          )}
        />
        <Stack.Screen
          name="MyProfile"
          options={{ headerShown: false }}
          children={() => (
            <MyProfileLayout>
              <MyProfile />
            </MyProfileLayout>
          )}
        />
      </Stack.Navigator>
    );
  };

  const LoginStack = () => {
    const [isLoading, setIsLoading] = useState(false);

    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="loginforJS"
          component={LoginForJS}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="otpscreen"
          component={OTPScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  };

  const MainTab = () => {
    return (
      <Tab.Navigator safeAreaInsets={{ bottom: 0 }}>
        <Tab.Screen
          name="Trang chủ"
          component={HomeStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="home-outline"
                size={24}
                color={focused ? "#FF7345" : "gray"}
              />
            ),
            tabBarActiveTintColor: "#FF7345",
          }}
        />

        <Tab.Screen
          name="Tìm Kiếm"
          component={SearchStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <MaterialIcons
                name="search"
                size={30}
                color={focused ? "#FF7345" : "gray"}
              />
            ),
            tabBarActiveTintColor: "#FF7345",
          }}
        />

        <Tab.Screen
          name="Lịch Trình"
          component={ScheduleStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={24}
                color={focused ? "#FF7345" : "gray"}
              />
            ),
            tabBarActiveTintColor: "#FF7345",
          }}
        />

        <Tab.Screen
          name="Tin Nhắn"
          component={MessageStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="message-text-outline"
                size={24}
                color={focused ? "#FF7345" : "gray"}
              />
            ),
            tabBarActiveTintColor: "#FF7345",
          }}
        />

        <Tab.Screen
          name="Tài khoản"
          component={ProfileStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={24}
                color={focused ? "#FF7345" : "black"}
              />
            ),
            tabBarActiveTintColor: "#FF7345",
          }}
        />
      </Tab.Navigator>
    );
  };

  // Define the RootStack Navigator
  const RootStackNav = () => {
    return (
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginStack}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainApp"
          component={MainTab}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <RootStackNav />
    </NavigationContainer>
  );
}
