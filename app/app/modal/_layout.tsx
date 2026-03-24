
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { Button, Platform } from 'react-native';
import i18n from '@/constants/i18n';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  

  const headerCancel = () => (
    <View style={{ marginRight: (Platform.OS === "android" || Platform.OS === "web") ? 15 : null, marginLeft: (Platform.OS === "web" ? 15 : null)}}>
      <Button title={i18n.t("modal.stack.cancel")} onPress={() => router.back()} />
    </View>
  );

  const headerBackground = () => {
    return (<View style={{ backgroundColor: theme.surface }}></View>)
  }

  return (
    <LinearGradient
        colors={theme.appThemeGradient.colors}
        start={theme.appThemeGradient.start}
        end={theme.appThemeGradient.end}
        style={{ flex: 1, opacity: theme.appThemeGradient.opacity ?? 1 }}
    >
      <BlurView style={{ flex: 1 }} intensity={60} tint={theme.type}>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.background }}
          edges={["top"]}
        >
            <Stack screenOptions={{ headerStyle: { backgroundColor: theme.surface.toString() }, contentStyle: { backgroundColor: "transparent" } }}>
                <Stack.Screen name="class/[action]" options={{ presentation: "modal", title: i18n.t("modal.class.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="subject/[action]" options={{ presentation: "modal", title: i18n.t("modal.subject.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="homework/[action]" options={{ presentation: "modal", title: i18n.t("modal.homework.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="lesson/[action]" options={{ presentation: "modal", title: i18n.t("modal.lesson.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="material/[action]" options={{ presentation: "modal", title: i18n.t("modal.material.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="grade/[action]" options={{ presentation: "modal", title: i18n.t("modal.grade.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="comunication/[action]" options={{ presentation: "modal", title: i18n.t("modal.comunication.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
                <Stack.Screen name="invitation/[action]" options={{ presentation: "modal", title: i18n.t("modal.invitation.stack.title"), headerShown: true, headerBackground, headerLeft: headerCancel }} />
            </Stack>
        </SafeAreaView>
      </BlurView>
    </LinearGradient>
  );
}