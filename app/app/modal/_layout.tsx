
import React from 'react';
import { Stack } from 'expo-router';
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
        <Stack>
            <Stack.Screen name="class" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="subject" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="homework" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="lesson" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="material" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="grade" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="comunication" options={{ title: "Class", headerShown: true,headerTransparent: true,headerTitle: "" }} />
        </Stack>
    </SafeAreaView>
  );
}
