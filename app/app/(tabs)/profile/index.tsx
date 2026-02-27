import { Text, View, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import DashboardItem from "@/components/dashboardItem";
import createStyling from "@/constants/styling";
import LoginComponent from "@/components/login";
import { router } from "expo-router";
import useAsyncData, { useAllAsyncData, KEYS, defaultData } from "@/data/datamanager";


export default function ProfileTab() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const userData = useAsyncData(KEYS.userData, defaultData.userData);
    const accountData = useAsyncData(KEYS.accountData, defaultData.accountData);
    const allUserClasses = useAllAsyncData(`${KEYS.classData}`, defaultData.classData);
    
    let profilePageData = {
        userdata: userData.data,
        classes: allUserClasses,
        accountdata: accountData
    };

    useFocusEffect(
        useCallback(() => {
            accountData.load();
            userData.load();
            allUserClasses.load();
        }, [])
    );

    const isUserLoggedIn = profilePageData.accountdata.data.active;
    
    return (
        <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
            <BlurView style={HomeScreenStyle.dashboardSectionHeader}>
                <Text style={HomeScreenStyle.welcomeText}>{isUserLoggedIn ? `Hello, ${profilePageData.userdata.userInfo.name}!` : "Profile"}</Text>
            </BlurView>
            <View style={HomeScreenStyle.dashboard}>
                <DashboardItem title="Your Profile" items={(()=>{
                    let items = [
                        { title: "Name", description: profilePageData.userdata.name, onPress: () => {
                            router.push("/profile/profiledata");
                        }},
                        { title: "Settings", description: "Manage your account settings", onPress: () => {
                            router.push("/profile/settings");
                        }}
                    ];
                    if (!isUserLoggedIn) {
                        items.push({ title: "Login", description: "Log in to your account", onPress: () => {
                            router.push("/welcome/account/login");
                        }});
                    } else {
                        items.push({ title: "Logout", description: "Log out of your account", onPress: () => {
                            router.push("/welcome/account/logout");
                        }});
                    }
                    return items;
                })()} />
                {isUserLoggedIn ? (
                    <DashboardItem title="Your Classes" items={Object.values(profilePageData.classes.data).map((e)=>{
                        return {
                            title: e.name,
                            description: `Teachers: ${e.teachers.filter(e=>e.name).join(", ")}\n${e.notes}`,
                            onPress: () => {
                                router.push(`/profile/class/${e.classid}`);
                            }
                        };
                    })} expand={()=>{
                        router.push("/profile/class/all");
                    }}/>
                ) : null}
            </View>
        </ScrollView>
    );
}