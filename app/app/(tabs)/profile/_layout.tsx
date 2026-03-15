import { Stack } from 'expo-router';
import { colors } from "@/constants/colors";
import i18n from '@/constants/i18n';


export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
        <Stack.Screen name="index" options={{ title: i18n.t("profile.stack.title")}} />
        <Stack.Screen name="settings/[page]" options={{ title: i18n.t("profile.settings.stack.title"), headerShown: true }} />
        <Stack.Screen name="class/[id]" options={{ headerShown: true, title: i18n.t("profile.class.stack.stacktitle"), headerTitle: i18n.t("profile.class.stack.title") }} />
        <Stack.Screen name="profiledata" options={{ presentation: "modal", headerShown: true, title: i18n.t("profile.stack.title"), headerStyle: { backgroundColor: "" } }} />
    </Stack>
  );
}
