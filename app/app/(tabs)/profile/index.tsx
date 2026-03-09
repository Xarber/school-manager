import { Text, View, ScrollView } from "react-native";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Stack, useFocusEffect } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import DashboardItem from "@/components/dashboardItem";
import createStyling from "@/constants/styling";
import LoginComponent from "@/components/login";
import { router } from "expo-router";
import { useAppDataSync, DataManager, ClassData } from "@/data/datamanager";
import NetInfo from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";
import createToastConfig from "@/constants/toast";

export default function ProfileTab() {
    const theme = useTheme();
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default, {populate: ["classes"]});
    const accountData = useAppDataSync(DataManager.accountData.db, DataManager.accountData.app, DataManager.accountData.default);

    if (userData.data.classes.length === 1 && userData.data.settings.activeClassId != (userData.data.classes[0]._id ?? userData.data.classes[0])) {
        userData.save({...userData.data, settings: {...userData.data.settings,
            activeClassId: (userData.data.classes[0]._id ?? userData.data.classes[0])
        }});
    }

    let profilePageData = {
        userdata: userData.data,
        classes: userData.data.classes.map((cls: ClassData) => (typeof cls === "object" ? {
            title: cls.name,
            description: cls.notes.slice(0, 2).join("\n"),
            badge: (cls._id === userData.data.settings.activeClassId ? {
                text: "Active",
                color: "#0A84FF"
            } : null),
            onPress: () => {
                router.push(`/profile/class/${cls._id}`);
            }
        } : null)),
        accountdata: accountData
    };

    let activeClassIndex = profilePageData.userdata.classes.findIndex((cls: ClassData) => cls._id === profilePageData.userdata.settings.activeClassId);

    if (activeClassIndex > 0) {
        const [item] = profilePageData.classes.splice(activeClassIndex, 1);
        profilePageData.classes.unshift(item);
    }

    useFocusEffect(
        useCallback(() => {
            accountData.load();
            userData.load();
        }, [])
    );

    const isUserLoggedIn = profilePageData.accountdata.data.active;
    
    return (
        <>
            <Stack.Screen options={{ headerTitle: "Profile" }} />
            <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]}>
                <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                    <Text style={HomeScreenStyle.welcomeText}>{isUserLoggedIn ? `Hello, ${profilePageData.userdata.userInfo.name}!` : "Profile"}</Text>
                </BlurView>
                <View style={HomeScreenStyle.dashboard}>
                    <DashboardItem title={isUserLoggedIn ? `Hello, ${profilePageData.userdata.userInfo.name}!` : "Not logged in"} items={(()=>{
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
                        <DashboardItem title="Your Classes" items={profilePageData.classes.slice(0, 5)} expand={()=>{ {/*  todo - load all classes */}
                            router.push("/profile/class/all");
                        }}/>
                    ) : null}
                </View>
            </ScrollView>
        </>
    );
}