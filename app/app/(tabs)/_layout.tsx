import { Tabs } from 'expo-router';
import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { FontAwesome, Feather } from "@expo/vector-icons";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.background },
          tabBarHideOnKeyboard: true
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => (
              <FontAwesome name="home" size={size} color={color} />
            ), }} />
        <Tabs.Screen name="calendar" options={{ title: "Calendar", tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size} color={color} />
            ), }} />
        <Tabs.Screen name="registry" options={{ title: "Registry", tabBarIcon: ({ color, size }) => (
              <Feather name="book" size={size} color={color} />
            ), }} />
        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ), }} />
        <Tabs.Screen name="ai" options={{ title: "AI", href: null, tabBarIcon: ({ color, size }) => (
              <Feather name="cpu" size={size} color={color} />
            ), }} />
      </Tabs>
    </SafeAreaView>
  );
}
