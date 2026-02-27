import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { FontAwesome, Feather } from "@expo/vector-icons";

function renderNativeTabs() {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <NativeTabs>
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home"/>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="event" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="registry">
          <NativeTabs.Trigger.Label>Registry</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="book.closed" md="menu_book" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person" md="person" />
        </NativeTabs.Trigger>
        {/*
          <NativeTabs.Trigger name="ai">
            <NativeTabs.Trigger.Label>AI</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf="cpu" drawable="smart_toy" />
          </NativeTabs.Trigger>
        */}
        </NativeTabs>
    </SafeAreaView>
  );
}

function renderTabs() {
  const theme = useTheme();
  return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.background },
          tabBarHideOnKeyboard: true
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => (
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
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="ai" options={{ href: null }} />
        {/*
          <Tabs.Screen name="ai" options={{ title: "AI", href: null, tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ), }} />
        */}
      </Tabs>
  )
}

export default function TabLayout() {
  const renderMode = "native"; // "native" for native tabs, any other for stable tabs.

  if ((renderMode as any) === "native") {
    return renderNativeTabs();
  }
  return renderTabs();
}