import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, title: "Profile" }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
        <Stack.Screen name="login" options={{ presentation: "modal", headerShown: true, title: "Login" }} />
        <Stack.Screen name="logout" options={{ presentation: "modal", headerShown: true, title: "Logout" }} />
        <Stack.Screen name="class/[id]" options={{ presentation: "modal", headerShown: true, title: "Class Details" }} />
        <Stack.Screen name="profiledata" options={{ presentation: "modal", headerShown: true, title: "Profile Data" }} />
    </Stack>
  );
}
