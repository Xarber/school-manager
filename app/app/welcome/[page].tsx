import { 
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Alert
} from "react-native";
import {  } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams, router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import useAsyncData, { KEYS, defaultData } from "@/data/datamanager";

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
                    <Text style={welcomeStyles.bottomViewHeaderTitle}>Have we met before?</Text>
                </View>
                <View style={welcomeStyles.bottomViewBody}>
                    <Text style={welcomeStyles.bottomViewBodyText}>Do you want to log into an account?</Text>
                </View>
            </View>
            <View style={welcomeStyles.actions}>
                <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => router.replace("/welcome/account")}>
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

    const [name, setName] = useState("");

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
                <KeyboardAvoidingView style={welcomeStyles.bottomView}
                    behavior="padding">
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>Let's get to know each other!</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>What's your name?</Text>
                        <TextInput style={welcomeStyles.bottomViewBodyInput} value={name} onChangeText={setName} placeholder="Name" />
                    </View>
                </KeyboardAvoidingView>
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
                                    router.replace("/welcome/setsurname");
                                }
                            },
                        ]);
                    }} >
                        <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
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

    const [surname, setSurname] = useState("");

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
                <KeyboardAvoidingView style={welcomeStyles.bottomView}
                    behavior="padding">
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>Let's get to know each other!</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>What about your surname?</Text>
                        <TextInput style={welcomeStyles.bottomViewBodyInput} value={surname} onChangeText={setSurname} placeholder="Surname" />
                    </View>
                </KeyboardAvoidingView>
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
                                    router.replace("/welcome/permissions");
                                }
                            },
                        ]);
                    }}>
                        <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function permissionsPage() {

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
        default:
            return <Redirect href="/(tabs)" />
    }
}