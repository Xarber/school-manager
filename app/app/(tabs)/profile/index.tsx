import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Stack, useFocusEffect } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import { BlurView } from "expo-blur";
import DashboardItem from "@/components/dashboardItem";
import createStyling from "@/constants/styling";
import { router } from "expo-router";
import { DataManager, ClassData, DataLoader } from "@/data/datamanager";
import NetInfo from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";
import createToastConfig from "@/constants/toast";
import i18n from "@/constants/i18n";
import { useAccountData } from "@/data/AccountDataContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserData } from "@/data/UserDataContext";

export default function ProfileTab() {
    const theme = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const HomeScreenStyle = createStyling.createHomeScreenStyles(theme);
    const commonStyle = createStyling.createCommonStyles(theme);
    const optimizationStyle = createStyling.createOptimizationStyles(theme);

    const userData = useUserData();
    const accountData = useAccountData();
    const [classMap, setClassMap] = useState(({} as {[key: string]: ClassData}));

    const safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    if (userData.data.classes.length === 1 && userData.data.settings.activeClassId != (userData.data.classes[0]._id ?? userData.data.classes[0])) {
        userData.save({...userData.data, settings: {...userData.data.settings,
            activeClassId: (userData.data.classes[0]._id ?? userData.data.classes[0])
        }});
    }

    const classIds = userData.data.classes;

    let classes = (Object.values(classMap) as ClassData[])
    .filter((cls: ClassData) => typeof cls === "object" && cls)
    .map((cls: ClassData) => {
        return ({
            _id: cls._id,
            title: cls.name,
            description: cls.notes.slice(0, 2).join("\n"),
            badge: (cls._id === userData.data.settings.activeClassId ? {
                text: i18n.t("profile.class.active.badge.title"),
                color: "#0A84FF"
            } : null),
            onPress: () => {
                router.push(`/profile/class/${cls._id}`);
            }
        })
    });

    let unloadedClasses = (classIds as string[])
    .filter((cls: any) => typeof classMap[cls] === "undefined")
    .map((cls: any) => {
        return ({
            _id: cls,
            title: `${i18n.t("profile.class.unloaded.class.title")}`,
            description: `${i18n.t("profile.class.unloaded.class.description")}`,
            badge: null,
            onPress: () => {}
        })
    });

    classes.push({
        _id: DataManager.classData.offline,
        title: i18n.t("profile.class.offlineclass.name"),
        description: i18n.t("profile.class.offlineclass.description"),
        badge: null,
        onPress: () => {
            router.push(`/profile/class/${DataManager.classData.offline}`);
        }
    });

    classes = [...classes, ...unloadedClasses];

    let profilePageData = {
        userdata: userData.data,
        classes,
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
            {classIds.map((id: string) => {
                return (
                    <DataLoader
                        key={id}
                        id={id}
                        keys={DataManager.classData}
                        body={{ classid: id }}
                        onLoad={(id, classdata) =>
                            setClassMap(prev => {
                                if (prev[id]?._id === classdata.data?._id) {
                                    return prev;
                                }
                                return {
                                    ...prev,
                                    [id]: classdata.data
                                };
                            })
                        }
                    />
                )
            })}
            {
                ((userData.loading || accountData.loading) && !refreshing) ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" color={theme.text} />
                    </View>
                ) : (
                    <ScrollView style={commonStyle.mainView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: safeAreaInsets.bottom }} refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={theme.text} />
                    }>
                        <BlurView style={[HomeScreenStyle.dashboardSectionHeader, {display: "none"}]}>
                            <Text style={HomeScreenStyle.welcomeText}>{isUserLoggedIn ? i18n.t("profile.customheader.loggedin.title", {user: profilePageData.userdata.userInfo.name}) : i18n.t("profile.customheader.loggedout.title")}</Text>
                        </BlurView>
                        <View style={[HomeScreenStyle.dashboard, optimizationStyle.container]}>
                            <View style={optimizationStyle.item}>
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
                            </View>
                            <View style={optimizationStyle.item}>
                                <DashboardItem title={i18n.t("profile.class.header.title")} items={(profilePageData.classes.slice(0, 5)) as any} expand={()=>{
                                    router.push("/profile/class/all");
                                }}/>
                            </View>
                        </View>
                    </ScrollView>
                )
            }
        </>
    );
}