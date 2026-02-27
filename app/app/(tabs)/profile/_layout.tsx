import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{ title: "Profile" }} />
        <Stack.Screen name="settings/index" options={{ headerShown: true, title: "Settings" }} />
        <Stack.Screen name="settings/[page]" options={{ title: "Settings", headerShown: true,headerTransparent: true,headerTitle: "" }} />
        <Stack.Screen name="class/[id]" options={{ headerShown: true, title: "Class Details", headerTitle: "Classes" }} />
        <Stack.Screen name="profiledata" options={{ presentation: "modal", headerShown: true, title: "Profile" }} />
    </Stack>
  );
}
