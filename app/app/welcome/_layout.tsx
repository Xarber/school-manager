import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/constants/useThemes";
import { colors } from "@/constants/colors";
import i18n from "@/constants/i18n";

export default function AccountLayout() {
    const theme = useTheme();
    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.background }}
            edges={["top"]}
        >
            <Stack screenOptions={{ headerStyle: { backgroundColor: colors.light.surface.toString() } }}>
                <Stack.Screen name="[page]" options={{ title: i18n.t("welcome.stack.title"), headerBackVisible: false,headerShown: false,headerTransparent: true,headerTitle: "" }} />
                <Stack.Screen name="account/[action]" options={{ presentation: "modal", headerShown: true, title: i18n.t("welcome.account.stack.title") }} />
            </Stack>
        </SafeAreaView>
    );
}