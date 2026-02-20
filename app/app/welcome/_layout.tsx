import { Stack } from "expo-router";

export default function AccountLayout() {
    return (
        <Stack>
            <Stack.Screen name="[page]" options={{ title: "Welcome", headerBackVisible: false,headerShown: true,headerTransparent: true,headerTitle: "" }} />
            <Stack.Screen name="account/[action]" options={{ presentation: "modal", headerShown: true, title: "Account" }} />
        </Stack>
    );
}