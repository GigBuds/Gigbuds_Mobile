import React, { useEffect, useState } from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";


import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import HomeScreen from "../Screen/HomeScreen/HomeScreen";
import text from "./text";
import MessageScreen from "../Screen/MessageScreen/MessageScreen";
import ScheduleScreen from "../Screen/ScheduleScreen/ScheduleScreen";
import ProfileScreen from "../Screen/ProfileScreen/ProfileScreen";
import SearchScreen from "../Screen/SearchScreen/SearchScreen";
import LoginScreen from "../Screen/LoginScreen/LoginScreen";
import LoginForJS from "../Screen/LoginScreen/LoginForJS/LoginForJS";
import LoginForEmployer from "../Screen/LoginScreen/LogineForEmployer/LoginForEmployer";


export default function Navigator() {
  const Tab = createBottomTabNavigator();
  const Stack = createNativeStackNavigator(); 

  const HomeStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

      </Stack.Navigator>
    );
  };

  const SearchStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Search"
          component={SearchScreen}
        />
      </Stack.Navigator>
    );
  }

  const MessageStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Message"
          component={MessageScreen}
        />
      </Stack.Navigator>
    );
  }
  const ScheduleStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Schedule"
          component={ScheduleScreen}
        />
      </Stack.Navigator>
    );
  }

  const ProfileStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />
      </Stack.Navigator>
    );
  }

  const LoginStack = () => {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='loginforJS'
          component={LoginForJS}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='loginforemployer'
          component={LoginForEmployer}
          options={{ headerShown: false }}
        />
         
      </Stack.Navigator>
    );
  }


  const MainTab = () => {
    return (
      <Tab.Navigator>
      <Tab.Screen
        name={text.HomeScreen.title}
        component={HomeStack}
        options={{
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Ionicons name="home-outline" size={24} color={focused ? "#FF7345" : "gray"} />
        ),
        tabBarActiveTintColor: "#FF7345",
        }}
      />

      <Tab.Screen
        name={text.SearchScreen.title}
        component={SearchStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="search" size={30} color={focused ? "#FF7345" : "gray"} />
          ),
          tabBarActiveTintColor: "#FF7345",
        }}
      />

      <Tab.Screen
        name={text.ScheduleScreen.title}
        component={ScheduleStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={24} color={focused ? "#FF7345" : "gray"} />
          ),
          tabBarActiveTintColor: "#FF7345",
        }}
      />

      <Tab.Screen
        name={text.MessageScreen.title}
        component={MessageStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name="message-text-outline" size={24} color={focused ? "#FF7345" : "gray"} />
          ),
          tabBarActiveTintColor: "#FF7345",
        }}
      />

      <Tab.Screen
        name={text.ProfileScreen.title}
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={24} color={focused ? "#FF7345" : "black"} />
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
