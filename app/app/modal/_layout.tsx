
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { Button } from 'react-native';

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  

  const headerCancel = () => (
    <Button title="Cancel" onPress={() => router.back()} />
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
        <Stack>
            <Stack.Screen name="class/[action]" options={{ presentation: "modal", title: "Class", headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="subject/[action]" options={{ presentation: "modal", title: "Subject", headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="homework/[action]" options={{ presentation: "modal", title: "Homework", headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="lesson/[action]" options={{ presentation: "modal", title: "Lesson", headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="material/[action]" options={{ presentation: "modal", title: "Material", headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="grade/[action]" options={{ presentation: "modal", title: "Grade", headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="comunication/[action]" options={{ presentation: "modal", title: "Communication", headerShown: true, headerLeft: headerCancel }} />
        </Stack>
    </SafeAreaView>
  );
}
