
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { Button, Platform } from 'react-native';
import { colors } from "@/constants/colors";
import i18n from '@/constants/i18n';
import { View } from 'react-native';

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  

  const headerCancel = () => (
    <View style={{ marginRight: Platform.OS === "android" ? 15 : null}}>
      <Button title={i18n.t("modal.stack.cancel")} onPress={() => router.back()} />
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
            <Stack.Screen name="class/[action]" options={{ presentation: "modal", title: i18n.t("modal.class.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="subject/[action]" options={{ presentation: "modal", title: i18n.t("modal.subject.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="homework/[action]" options={{ presentation: "modal", title: i18n.t("modal.homework.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="lesson/[action]" options={{ presentation: "modal", title: i18n.t("modal.lesson.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="material/[action]" options={{ presentation: "modal", title: i18n.t("modal.material.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="grade/[action]" options={{ presentation: "modal", title: i18n.t("modal.grade.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="comunication/[action]" options={{ presentation: "modal", title: i18n.t("modal.comunication.stack.title"), headerShown: true, headerLeft: headerCancel }} />
            <Stack.Screen name="invitation/[action]" options={{ presentation: "modal", title: i18n.t("modal.invitation.stack.title"), headerShown: true, headerLeft: headerCancel }} />
        </Stack>
    </SafeAreaView>
  );
}
