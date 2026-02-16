import { Text, View, ScrollView } from "react-native";
import { useState } from "react";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import DashboardItem from "@/components/dashboardItem";
import createStyling from "@/constants/styling";
import LoginComponent from "@/components/login";


export default function ProfileTab() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const userProfileStyle = createStyling.createUserProfileStyles(theme);
    const userLoginStyle = createStyling.createUserLoginStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const isUserLoggedIn = true; // Replace with actual authentication logic
    const [loginMode, setLoginMode] = useState<"login" | "signup" | "forgotPassword">("login");
    
    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>{isUserLoggedIn ? "Hello, user!" : "Profile"}</Text>
            </BlurView>
            {isUserLoggedIn ? (
                <View style={HomeScreenStyle.dashboard}>
                    <DashboardItem title="Your Profile" items={[
                        { title: "Name", description: "John Doe" },
                        { title: "Settings", description: "Manage your account settings" },
                        { title: "Logout", description: "Sign out of your account" },
                    ]} />
                    <DashboardItem title="Your Classes" items={[
                        { title: "3P", description: "Managed by John Doe", badge: { text: "active", color: "rgba(0, 255, 0, 0.8)" } },
                        { title: "C++ Course", description: "Managed by Jane Smith" },
                        { title: "Music", description: "Managed by John Doe" },
                    ]} />
                </View>
            ) : (
                <LoginComponent mode={loginMode} setMode={setLoginMode} />
            )}
        </ScrollView>
    );
}