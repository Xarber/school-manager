import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Stack, useFocusEffect } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import DashboardItem from "@/components/dashboardItem";
import createStyling from "@/constants/styling";
import { router } from "expo-router";
import { useAppDataSync, DataManager, ClassData } from "@/data/datamanager";
import NetInfo from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";
import createToastConfig from "@/constants/toast";
import i18n from "@/constants/i18n";
import { useAccountData } from "@/data/AccountDataContext";

export default function ProfileTab() {
    const theme = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default, {populate: ["classes"]});
    const accountData = useAccountData();

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
                text: i18n.t("profile.class.active.badge.title"),
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

    const reload = async () => {
        setRefreshing(true);
        //await Promise.all([userData.load()]);
        await Promise.all([accountData.load(), userData.load()]);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [])
    );

    const isUserLoggedIn = profilePageData.accountdata.data.active;
    
    return (
        <>
            <Stack.Screen options={{ headerTitle: i18n.t("profile.stack.title") }} />
            {
                ((userData.loading || accountData.loading) && !refreshing) ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" />
                    </View>
                ) : (
                    <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]} refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={reload}/>
                    }>
                        <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                            <Text style={HomeScreenStyle.welcomeText}>{isUserLoggedIn ? i18n.t("profile.customheader.loggedin.title", {user: profilePageData.userdata.userInfo.name}) : i18n.t("profile.customheader.loggedout.title")}</Text>
                        </BlurView>
                        <View style={HomeScreenStyle.dashboard}>
                            <DashboardItem title={isUserLoggedIn ? i18n.t("profile.panel.loggedin.title", {user: profilePageData.userdata.userInfo.name}) : i18n.t("profile.panel.loggedout.title")} items={(()=>{
                                let items = [
                                    { title: i18n.t("profile.panel.name.title"), description: profilePageData.userdata.name, onPress: () => {
                                        router.push("/profile/profiledata");
                                    }},
                                    { title: i18n.t("profile.panel.settings.title"), description: i18n.t("profile.panel.settings.description"), onPress: () => {
                                        router.push("/profile/settings/all");
                                    }}
                                ];
                                if (!isUserLoggedIn) {
                                    items.push({ title: i18n.t("profile.panel.login.title"), description: i18n.t("profile.panel.login.description"), onPress: () => {
                                        router.push("/welcome/account/login");
                                    }});
                                } else {
                                    items.push({ title: i18n.t("profile.panel.logout.title"), description: i18n.t("profile.panel.logout.description"), onPress: () => {
                                        router.push("/welcome/account/logout");
                                    }});
                                }
                                return items;
                            })()} />
                            {isUserLoggedIn ? (
                                <DashboardItem title={i18n.t("profile.class.header.title")} items={profilePageData.classes.slice(0, 5)} expand={()=>{
                                    router.push("/profile/class/all");
                                }}/>
                            ) : null}
                        </View>
                    </ScrollView>
                )
            }
        </>
    );
}