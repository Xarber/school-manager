import { Text, View, ScrollView } from "react-native";
import { useState } from "react";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import DashboardItem from "@/components/dashboardItem";
import createStyling from "@/constants/styling";
import LoginComponent from "@/components/login";
import { router } from "expo-router";


export default function ProfileTab() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const isUserLoggedIn = true; // Replace with actual authentication logic
    
    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>{isUserLoggedIn ? "Hello, user!" : "Profile"}</Text>
            </BlurView>
            <View style={HomeScreenStyle.dashboard}>
                <DashboardItem title="Your Profile" items={(()=>{
                    let items = [
                        { title: "Name", description: "John Doe" },
                        { title: "Settings", description: "Manage your account settings", onPress: () => {
                            router.push("/profile/settings");
                        }}
                    ];
                    if (!isUserLoggedIn) {
                        items.push({ title: "Login", description: "Log in to your account", onPress: () => {
                            router.push("/profile/login");
                        }});
                    } else {
                        items.push({ title: "Logout", description: "Log out of your account", onPress: () => {
                            router.push("/profile/logout");
                        }});
                    }
                    return items;
                })()} />
                {isUserLoggedIn ? (
                    <DashboardItem title="Your Classes" items={[
                        { title: "3P", description: "Managed by John Doe", badge: { text: "active", color: "rgba(0, 255, 0, 0.8)" } },
                        { title: "C++ Course", description: "Managed by Jane Smith" },
                        { title: "Music", description: "Managed by John Doe" },
                    ]} />
                ) : null}
            </View>
        </ScrollView>
    );
}