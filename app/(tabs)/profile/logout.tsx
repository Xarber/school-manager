import { Text, View } from "react-native";
import { Pressable } from "react-native";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";

export default function LogoutTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={commonStyle.text}>Are you sure you want to logout?</Text>
            <Pressable style={{ marginTop: 20, padding: 10, backgroundColor: theme.primary, borderRadius: 5 }} onPress={()=>{console.log("Loggedout")}}>
                <Text style={{ color: theme.background, fontWeight: "bold" }}>Logout</Text>
            </Pressable>
        </View>
    );
}