import { 
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useRouter, useLocalSearchParams, router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import useAsyncData, { KEYS, defaultData } from "@/data/datamanager";

import { registerForPushNotificationsAsync } from "@/data/notifications";
import { KeyboardShift } from "@/components/keyboardShift";

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
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>Welcome!</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>Let's get you right into the app.</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => router.replace("/welcome/restore")}>
                    <Text style={welcomeStyles.actionsButtonText}>Get Started</Text>
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
    const accountData = useAsyncData(KEYS.accountData, defaultData.accountData);

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
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>Have we met before?</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>Do you want to log into an account?</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => router.push("/welcome/account/login")}>
                    <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{...welcomeStyles.actionsButton, backgroundColor: theme.secondary}} onPress={() => router.replace("/welcome/setname")}>
                    <Text style={welcomeStyles.actionsButtonText}>Maybe later</Text>
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

    const userData = useAsyncData(KEYS.userData, defaultData.userData);

    const [name, setName] = useState("");
    if (!userData.loading && name === "" && userData.data.userInfo.name != "") setName(userData.data.userInfo.name);

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}

            >
                <View style={welcomeStyles.topView}>
                    <Image source={image} style={welcomeStyles.topViewImage} />
                </View>
                <View style={welcomeStyles.bottomView}>
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>Let's get to know each other!</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>What's your name?</Text>
                        <TextInput style={welcomeStyles.bottomViewBodyInput} value={name} onChangeText={setName} placeholder="Name" />
                    </View>
                </View>
                <KeyboardShift>
                    <View style={welcomeStyles.actions}>
                        <TouchableOpacity disabled={!name} style={!name ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} 
                        onPress={() => {
                            Alert.alert("Is this correct?", name, [
                                {
                                    text: "No",
                                    onPress: () => {
                                        setName("");
                                    }
                                },
                                {
                                    text: "Yes",
                                    onPress: () => {
                                        userData.save({...userData.data, userInfo: {...userData.data.userInfo, name}});
                                        router.replace("/welcome/setsurname");
                                    }
                                },
                            ]);
                        }} >
                            <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardShift>
            </ScrollView>
        </SafeAreaView>
    );
}

function setSurnamePage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");

    const userData = useAsyncData(KEYS.userData, defaultData.userData);

    const [surname, setSurname] = useState("");
    if (!userData.loading && surname === "" && userData.data.userInfo.surname != "") setSurname(userData.data.userInfo.surname);

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View style={welcomeStyles.topView}>
                    <Image source={image} style={welcomeStyles.topViewImage} />
                </View>
                <View style={welcomeStyles.bottomView}>
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>Let's get to know each other!</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>What about your surname?</Text>
                        <TextInput style={welcomeStyles.bottomViewBodyInput} value={surname} onChangeText={setSurname} placeholder="Surname" />
                    </View>
                </View>
                <KeyboardShift>
                    <View style={welcomeStyles.actions}>
                        <TouchableOpacity disabled={!surname} style={!surname ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} 
                        onPress={() => {
                            Alert.alert("Is this correct?", surname, [
                                {
                                    text: "No",
                                    onPress: () => {
                                        setSurname("");
                                    }
                                },
                                {
                                    text: "Yes",
                                    onPress: () => {
                                        userData.save({...userData.data, name: `${userData.data.userInfo.name} ${surname}`, userInfo: {...userData.data.userInfo, surname}});
                                        router.replace("/welcome/notifications");
                                    }
                                },
                            ]);
                        }}>
                            <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardShift>
            </ScrollView>
        </SafeAreaView>
    );
}

function notificationsPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const accountData = useAsyncData(KEYS.accountData, defaultData.accountData);

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
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>Stay updated?</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>Do you want to enable notifications?</Text>
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
                    <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
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

    const appDebugData = useAsyncData(KEYS.debugData, defaultData.debugData);
    if (appDebugData.loading === false && appDebugData.data.firstLaunch === false) {
        appDebugData.save({...appDebugData.data, firstLaunch: true, firstLaunchDate: new Date().toString()}).then(() => {
            appDebugData.load();
        });
    }

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
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>All done!</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>You can start using the app now!</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => {
                    router.replace("/(tabs)");
                }}>
                    <Text style={welcomeStyles.actionsButtonText}>Complete</Text>
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