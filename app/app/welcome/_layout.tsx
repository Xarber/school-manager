import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";

export default function AccountLayout() {
    const theme = useTheme();
    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.background }}
            edges={["top"]}
        >
            <Stack>
                <Stack.Screen name="[page]" options={{ title: "Welcome", headerBackVisible: false,headerShown: true,headerTransparent: true,headerTitle: "" }} />
                <Stack.Screen name="account/[action]" options={{ presentation: "modal", headerShown: true, title: "Account" }} />
            </Stack>
        </SafeAreaView>
    );
}