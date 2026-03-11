import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { FontAwesome, Feather } from "@expo/vector-icons";
import i18n from '@/constants/i18n';

function renderNativeTabs() {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <NativeTabs>
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Label>{i18n.t("root.tabs.home.label")}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home"/>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <NativeTabs.Trigger.Label>{i18n.t("root.tabs.calendar.label")}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="event" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="registry">
          <NativeTabs.Trigger.Label>{i18n.t("root.tabs.registry.label")}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="book.closed" md="menu_book" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>{i18n.t("root.tabs.profile.label")}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person" md="person" />
        </NativeTabs.Trigger>
        {/*
          <NativeTabs.Trigger name="ai">
            <NativeTabs.Trigger.Label>{i18n.t("root.tabs.ai.label")}</NativeTabs.Trigger.Label>
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
        <Tabs.Screen name="home" options={{ title: i18n.t("root.tabs.home.label"), tabBarIcon: ({ color, size }) => (
          <FontAwesome name="home" size={size} color={color} />
        ), }} />
        <Tabs.Screen name="calendar" options={{ title: i18n.t("root.tabs.calendar.label"), tabBarIcon: ({ color, size }) => (
          <Feather name="calendar" size={size} color={color} />
        ), }} />
        <Tabs.Screen name="registry" options={{ title: i18n.t("root.tabs.registry.label"), tabBarIcon: ({ color, size }) => (
          <Feather name="book" size={size} color={color} />
        ), }} />
        <Tabs.Screen name="profile" options={{ title: i18n.t("root.tabs.profile.label"), tabBarIcon: ({ color, size }) => (
          <Feather name="user" size={size} color={color} />
        ), }} />
        <Tabs.Screen name="ai" options={{ href: null }} />
        {/*
          <Tabs.Screen name="ai" options={{ title: i18n.t("root.tabs.ai.label"), href: null, tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ), }} />
        */}
        <Tabs.Screen name="index" options={{ href: null }} />
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