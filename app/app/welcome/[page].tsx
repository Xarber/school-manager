import { 
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Platform
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";

import { turnOnNotifications } from "@/data/notifications";
import { KeyboardShift } from "@/components/keyboardShift";
import { useAlert } from "@/components/alert/AlertContext";
import i18n from "@/constants/i18n";
import { useUserData } from "@/data/UserDataContext";
import { useAccountData } from "@/data/AccountDataContext";

import welcomeImage from "@/assets/images/welcome.png";
import { isDevice } from "expo-device";
import { useNetworkContext } from "@/constants/NetworkContext";
import { Ionicons } from "@expo/vector-icons";
import { useDebugData } from "@/data/DebugDataContext";

function StartPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    return (
        <View
            style={welcomeStyles.container}
        >
            <View style={welcomeStyles.topView}>
                <Image source={welcomeImage} style={welcomeStyles.topViewImage} />
            </View>
            <View style={welcomeStyles.bottomView}>
                <View style={welcomeStyles.bottomViewHeader}>
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.main.title")}</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.main.description")}</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => router.replace("/welcome/restore")}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.main.start")}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function RestorePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const network = useNetworkContext();

    const accountData = useAccountData();
    
    const reload = async () => {
        await Promise.all([accountData.load()]);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [])
    );

    return accountData.data.active ? <Redirect href="/welcome/notifications" /> : (
        <View
            style={welcomeStyles.container}
        >
            <View style={welcomeStyles.topView}>
                <Image source={welcomeImage} style={welcomeStyles.topViewImage} />
            </View>
            <View style={welcomeStyles.bottomView}>
                <View style={welcomeStyles.bottomViewHeader}>
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.account.title")}</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.description")}</Text>
                    {network.ready && !network.isOnline ? (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
                            <Ionicons name="alert-circle" size={40} color={theme.text} />
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.networkunavailable")}</Text>
                        </View>
                    ) : (network.ready && !network.serverReachable && (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
                            <Ionicons name="alert-circle" size={40} color={theme.text} />
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.serverunreachable")}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity disabled={!network.ready || !network.isOnline || !network.serverReachable} style={[welcomeStyles.actionsButton, (!network.ready || !network.isOnline || !network.serverReachable) ? { backgroundColor: theme.disabled } : null]} onPress={() => router.push("/welcome/account/login")}>
                    {network.ready ? 
                        <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.login")}</Text>
                        : <ActivityIndicator size="small" color={theme.text} />
                    }
                    
                </TouchableOpacity>
                <TouchableOpacity style={{...welcomeStyles.actionsButton, backgroundColor: theme.secondary}} onPress={() => router.replace("/welcome/setname")}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.skip")}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function SetNamePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const userData = useUserData();
    let safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const [name, setName] = useState("");
    if (!userData.loading && name === "" && userData.data.userInfo.name != "") setName(userData.data.userInfo.name);

    const alert = useAlert();

    return (
        <KeyboardShift extraPadding={-safeAreaInsets.bottom + 20}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <View style={welcomeStyles.container}>
                    <View style={welcomeStyles.topView}>
                        <Image source={welcomeImage} style={welcomeStyles.topViewImage} />
                    </View>
                    <View style={welcomeStyles.bottomView}>
                        <View style={welcomeStyles.bottomViewHeader}>
                            <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.name.title")}</Text>
                        </View>
                        <View style={welcomeStyles.bottomViewBody}>
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.name.description")}</Text>
                            <TextInput autoFocus autoCapitalize="words" maxLength={30} style={welcomeStyles.bottomViewBodyInput} value={name} onChangeText={setName} placeholder={i18n.t("welcome.name.input.placeholder")} />
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View style={[welcomeStyles.actions, {padding: 20, paddingBottom: safeAreaInsets.bottom, paddingTop: 10}]}>
                <TouchableOpacity disabled={!name} style={!name ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} 
                onPress={() => {
                    alert.show({
                        title: i18n.t("welcome.name.confirm.title"),
                        message: name,
                        actions: [
                            {
                                title: i18n.t("welcome.name.confirm.true"),
                                onPress: () => {
                                    userData.save({...userData.data, userInfo: {...userData.data.userInfo, name}});
                                    router.replace("/welcome/setsurname");
                                }
                            },
                            {
                                title: i18n.t("welcome.name.confirm.false"),
                                onPress: () => {
                                    setName("");
                                }
                            },
                    ]});
                }} >
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.name.next")}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardShift>
    );
}

function SetSurnamePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const userData = useUserData();
    let safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const [surname, setSurname] = useState("");
    if (!userData.loading && surname === "" && userData.data.userInfo.surname != "") setSurname(userData.data.userInfo.surname);

    const alert = useAlert();

    return (
        <KeyboardShift extraPadding={-safeAreaInsets.bottom + 20}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <View style={welcomeStyles.container}>
                    <View style={welcomeStyles.topView}>
                        <Image source={welcomeImage} style={welcomeStyles.topViewImage} />
                    </View>
                    <View style={welcomeStyles.bottomView}>
                        <View style={welcomeStyles.bottomViewHeader}>
                            <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.surname.title")}</Text>
                        </View>
                        <View style={welcomeStyles.bottomViewBody}>
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.surname.description")}</Text>
                            <TextInput autoFocus autoCapitalize="words" maxLength={40} style={welcomeStyles.bottomViewBodyInput} value={surname} onChangeText={setSurname} placeholder={i18n.t("welcome.surname.input.placeholder")} />
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View style={[welcomeStyles.actions, {padding: 20, paddingBottom: safeAreaInsets.bottom, paddingTop: 10}]}>
                <TouchableOpacity disabled={!surname} style={!surname ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} 
                onPress={() => {
                    alert.show({
                        title: i18n.t("welcome.surname.confirm.title"),
                        message: surname,
                        actions: [
                            {
                                title: i18n.t("welcome.surname.confirm.true"),
                                onPress: () => {
                                    userData.save({...userData.data, name: `${userData.data.userInfo.name} ${surname}`, userInfo: {...userData.data.userInfo, surname}});
                                    router.replace("/welcome/notifications");
                                }
                            },
                            {
                                title: i18n.t("welcome.surname.confirm.false"),
                                onPress: () => {
                                    setSurname("");
                                }
                            },
                        ]
                    })
                }}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.surname.next")}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardShift>
    );
}

function NotificationsPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const accountData = useAccountData();
    const userData = useUserData();

    const alert = useAlert();

    return (
        <View
            style={welcomeStyles.container}
        >
            {(!isDevice || Platform.OS === "web") && <Redirect href="/welcome/complete" />}
            <View style={welcomeStyles.topView}>
                <Image source={welcomeImage} style={welcomeStyles.topViewImage} />
            </View>
            <View style={welcomeStyles.bottomView}>
                <View style={welcomeStyles.bottomViewHeader}>
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.notifications.title")}</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.notifications.description")}</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => {
                    // Ask for notifications permission
                    turnOnNotifications({accountData, userData}).then((status)=>{
                        if (status === true) return router.push("/welcome/complete");
                    }).catch((err) => {
                        alert.show({
                            title: i18n.t("welcome.notifications.error.title"),
                            message: i18n.t("welcome.notifications.error.description"),
                            actions: [
                                {
                                    title: i18n.t("welcome.notifications.error.ok"),
                                    onPress: ()=>{
                                        alert.hide();
                                        return router.replace("/welcome/complete");
                                    }
                                }
                            ]
                        });
                    })
                }}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.notifications.next")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{...welcomeStyles.actionsButton, backgroundColor: theme.secondary}} onPress={() => router.replace("/welcome/complete")}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.notifications.skip")}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function CompletePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const appDebugData = useDebugData();

    useEffect(() => { 
        if (appDebugData.loading === false && appDebugData.data.firstLaunch != true) {
            appDebugData.save({
                ...appDebugData.data,
                firstLaunch: true,
                firstLaunchDate: new Date().toString()
            });
        }
    }, [appDebugData.loading]);  

    return (
        <View
            style={welcomeStyles.container}
        >
            <View style={welcomeStyles.topView}>
                <Image source={welcomeImage} style={welcomeStyles.topViewImage} />
            </View>
            <View style={welcomeStyles.bottomView}>
                <View style={welcomeStyles.bottomViewHeader}>
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.complete.title")}</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.complete.description")}</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity disabled={appDebugData.loading} style={(appDebugData.loading ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : {...welcomeStyles.actionsButton})} onPress={() => {
                    router.replace("/(tabs)");
                }}>
                    {appDebugData.loading ? <ActivityIndicator size="small" color={theme.text} /> : <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.complete.finish")}</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function WelcomeScreen() {
    const params = useLocalSearchParams();
    const page = params.page as string;

    if (page === "setname" || page === "setsurname") return (
        <>
            {
                page === "setname"
                ? <SetNamePage />
                : <SetSurnamePage />
            }
        </>
    )

    return (
        <SafeAreaView
            style={{ flex: 1 }}
            edges={["bottom", "left", "right", "top"]}
        >
            {page === "start" ? <StartPage />
            : page === "restore" ? <RestorePage />
            : page === "notifications" ? <NotificationsPage />
            : page === "complete" ? <CompletePage />
            : <Redirect href="/(tabs)" />}
        </SafeAreaView>
    );
}