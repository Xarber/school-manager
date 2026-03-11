import { 
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { useRouter, useLocalSearchParams, router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import { useAppDataSync, DataManager } from "@/data/datamanager";

import { registerForPushNotificationsAsync } from "@/data/notifications";
import { KeyboardShift } from "@/components/keyboardShift";
import { useAlert } from "@/components/alert/AlertContext";
import i18n from "@/constants/i18n";

function startPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <View style={welcomeStyles.topView}>
                <Image source={image} style={welcomeStyles.topViewImage} />
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
        </SafeAreaView>
    );
}

function restorePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");
    const accountData = useAppDataSync(DataManager.accountData.db, DataManager.accountData.app, DataManager.accountData.default);

    useFocusEffect(
        useCallback(() => {
            accountData.load();
        }, [])
    );

    return accountData.data.active ? <Redirect href="/welcome/notifications" /> : (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <View style={welcomeStyles.topView}>
                <Image source={image} style={welcomeStyles.topViewImage} />
            </View>
            <View style={welcomeStyles.bottomView}>
                <View style={welcomeStyles.bottomViewHeader}>
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.account.title")}</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.description")}</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => router.push("/welcome/account/login")}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.login")}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{...welcomeStyles.actionsButton, backgroundColor: theme.secondary}} onPress={() => router.replace("/welcome/setname")}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.skip")}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function setNamePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const [name, setName] = useState("");
    if (!userData.loading && name === "" && userData.data.userInfo.name != "") setName(userData.data.userInfo.name);

    const alert = useAlert();

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <KeyboardShift extraPadding={-160}>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View style={welcomeStyles.topView}>
                        <Image source={image} style={welcomeStyles.topViewImage} />
                    </View>
                    <View style={welcomeStyles.bottomView}>
                        <View style={welcomeStyles.bottomViewHeader}>
                            <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.name.title")}</Text>
                        </View>
                        <View style={welcomeStyles.bottomViewBody}>
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.name.description")}</Text>
                            <TextInput style={welcomeStyles.bottomViewBodyInput} value={name} onChangeText={setName} placeholder={i18n.t("welcome.name.input.placeholder")} />
                        </View>
                    </View>
                        <View style={welcomeStyles.actions}>
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
                </ScrollView>
            </KeyboardShift>
        </SafeAreaView>
    );
}

function setSurnamePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    const [surname, setSurname] = useState("");
    if (!userData.loading && surname === "" && userData.data.userInfo.surname != "") setSurname(userData.data.userInfo.surname);

    const alert = useAlert();

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <KeyboardShift extraPadding={-160}>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View style={welcomeStyles.topView}>
                        <Image source={image} style={welcomeStyles.topViewImage} />
                    </View>
                    <View style={welcomeStyles.bottomView}>
                        <View style={welcomeStyles.bottomViewHeader}>
                            <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.surname.title")}</Text>
                        </View>
                        <View style={welcomeStyles.bottomViewBody}>
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.surname.description")}</Text>
                            <TextInput style={welcomeStyles.bottomViewBodyInput} value={surname} onChangeText={setSurname} placeholder={i18n.t("welcome.surname.input.placeholder")} />
                        </View>
                    </View>
                        <View style={welcomeStyles.actions}>
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
                </ScrollView>
            </KeyboardShift>
        </SafeAreaView>
    );
}

function notificationsPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const accountData = useAppDataSync(DataManager.accountData.db, DataManager.accountData.app, DataManager.accountData.default);

    const image = require("@/assets/images/welcome.png");

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <View style={welcomeStyles.topView}>
                <Image source={image} style={welcomeStyles.topViewImage} />
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
                    registerForPushNotificationsAsync().then(token => {
                        accountData.save({...accountData.data, pushToken: token});
                        return router.replace("/welcome/complete");
                    });
                }}>
                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.notifications.next")}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function completePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");

    const appDebugData = useAppDataSync(DataManager.debugData.db, DataManager.debugData.app, DataManager.debugData.default);

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
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <View style={welcomeStyles.topView}>
                <Image source={image} style={welcomeStyles.topViewImage} />
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
                    {appDebugData.loading ? <ActivityIndicator color="white" /> : <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.complete.finish")}</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

export default function welcomeScreen() {
    const params = useLocalSearchParams();
    const page = params.page as string;

    switch (page) {
        case "start":
            return startPage();
        case "restore":
            return restorePage();
        case "setname":
            return setNamePage();
        case "setsurname":
            return setSurnamePage();
        case "notifications":
            return notificationsPage();
        case "complete":
            return completePage();
        default:
            return <Redirect href="/(tabs)" />
    }
}