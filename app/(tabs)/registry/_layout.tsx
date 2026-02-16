import {Stack} from "expo-router";

export default function RegistryLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false, title: "Registry" }} />
        </Stack>
    );
}