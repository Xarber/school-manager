import { Stack } from 'expo-router';
import { colors } from "@/constants/colors";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
        <Stack.Screen name="index" options={{ title: "Profile" }} />
        <Stack.Screen name="settings/[page]" options={{ title: "Settings", headerShown: true }} />
        <Stack.Screen name="class/[id]" options={{ headerShown: true, title: "Class Details", headerTitle: "Classes" }} />
        <Stack.Screen name="profiledata" options={{ presentation: "modal", headerShown: true, title: "Profile" }} />
    </Stack>
  );
}
