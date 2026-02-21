import { 
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams, router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import useAsyncData, { DBKEYS, KEYS, defaultData, useDBdata } from "@/data/datamanager";
import { KeyboardShift } from "@/components/keyboardShift";

export function validateEmail(email: string) {
    return !!String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
}

async function sendOtp(email: string, setotpsent: Function) {

    const status = await fetch(DBKEYS.db + DBKEYS.authenticate, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => {
        return response.json()
    });

    if (status.success) {
        setotpsent(true);
    } else {
        Alert.alert("Failed to send OTP code", status.message);
    }
}

async function verifyOtp(email: string, otpcode: string, reset: Function) {

    const status = await fetch(DBKEYS.db + DBKEYS.authenticateOtp, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code: otpcode })
    })
    .then(response => {
        return response.json()
    });

    if (status.success) {
        return status;
    } else {
        switch (status.error) {
            case "Invalid or expired code":
                Alert.alert("Invalid OTP code");
                reset();
                break;
            case "Login failed":
                Alert.alert("Error", "Unknown error. Please try again later.");
                break;
            default:
                Alert.alert("Failed to verify OTP code", (status.message || status.error));
                break;
        }
    }
}

function loginPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const [email, setEmail] = useState("");
    const [otpcode, setOtpcode] = useState("");
    const [otpsent, setOtpsent] = useState(false);

    const accountData = useAsyncData(KEYS.accountData, defaultData.accountData);

    const reset = () => {
        setOtpsent(false);
        setOtpcode("");
    }

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
                </View>
                <View style={welcomeStyles.bottomView}>
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>Hello, fellow user!</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>We'll send a verification code to log you in or create a new account.</Text>
                        <View style={welcomeStyles.bottomViewBodyForm}>
                            <View style={welcomeStyles.bottomViewBodyFormField}>
                                <Text style={welcomeStyles.bottomViewBodyFormFieldText}>Email Address</Text>
                                <TextInput style={welcomeStyles.bottomViewBodyFormFieldInput} value={email} onChangeText={(text)=>{reset(); setEmail(text);}} placeholder="Email" />
                            </View>
                            <View style={!otpsent ? {display: "none"} : welcomeStyles.bottomViewBodyFormField}>
                                <Text style={welcomeStyles.bottomViewBodyFormFieldText}>OTP Code</Text>
                                <TextInput style={welcomeStyles.bottomViewBodyFormFieldInput} value={otpcode} onChangeText={setOtpcode} placeholder="Password" />
                            </View>
                        </View>
                    </View>
                </View>
                <KeyboardShift extraPadding={120}>
                    <View style={welcomeStyles.actions}>
                        <TouchableOpacity disabled={!validateEmail(email)} style={!validateEmail(email) ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} onPress={() => {
                            if (!otpsent) {
                                sendOtp(email, setOtpsent);
                            } else {
                                verifyOtp(email, otpcode, reset).then(status => {
                                    if (!status.success) return;
                                    accountData.save({
                                        ...accountData.data,
                                        username: email,
                                        token: status.token
                                    }).then(() => {
                                        if (status.isNewUser) router.replace("/welcome/account/signup");
                                        else router.replace("/welcome/account/loggedin");
                                    });
                                });
                            }
                        }}>
                            <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardShift>
            </ScrollView>
        </SafeAreaView>
    );
}

function signupPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");

    const userData = useAsyncData(KEYS.userData, defaultData.userData);

    const dbUserData = useDBdata(DBKEYS.accountData);

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
                </View>
                <View style={welcomeStyles.bottomView}>
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>Welcome!</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>Thank you for creating an account!{"\n"}What's your name?</Text>
                        <View style={welcomeStyles.bottomViewBodyForm}>
                            <View style={welcomeStyles.bottomViewBodyFormField}>
                                <Text style={welcomeStyles.bottomViewBodyFormFieldText}>Name</Text>
                                <TextInput style={welcomeStyles.bottomViewBodyFormFieldInput} value={name} onChangeText={setName} placeholder="Name" />
                            </View>
                            <View style={welcomeStyles.bottomViewBodyFormField}>
                                <Text style={welcomeStyles.bottomViewBodyFormFieldText}>Surname</Text>
                                <TextInput style={welcomeStyles.bottomViewBodyFormFieldInput} value={surname} onChangeText={setSurname} placeholder="Surname" />
                            </View>
                        </View>
                    </View>
                </View>
                <KeyboardShift extraPadding={120}>
                    <View style={welcomeStyles.actions}>
                        <TouchableOpacity disabled={!name || !surname} style={(!name || !surname) ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} onPress={() => {
                            Alert.alert("Is this correct?", `${name} ${surname}`, [
                                {
                                    text: "No",
                                    onPress: () => {
                                        setName("");
                                        setSurname("");
                                    }
                                },
                                {
                                    text: "Yes",
                                    onPress: () => {
                                        dbUserData.save({name, surname}).then(() => {
                                            userData.save({...userData.data, name: `${name} ${surname}`, userInfo: {...userData.data.userInfo, name, surname}});
                                            router.replace("/welcome/account/loggedin");
                                        });
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

function loggedinPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");
    const accountData = useAsyncData(KEYS.accountData, defaultData.accountData);
    const userData = useAsyncData(KEYS.userData, defaultData.userData);

    const dbUserData = useDBdata(DBKEYS.accountData);

    if (!dbUserData.loading && !dbUserData.error) {
        userData.save({...userData.data, name: `${dbUserData.data.name} ${dbUserData.data.surname}`, userInfo: {...userData.data.userInfo, name: dbUserData.data.name, surname: dbUserData.data.surname}}).then(()=>{
            userData.load();
        });
    }

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
                    <Image style={welcomeStyles.topViewImage} source={image} />
                </View>
                <View style={welcomeStyles.bottomView}>
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>{userData.data.name}</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>You've successfully logged in!</Text>
                    </View>
                </View>
                <View style={welcomeStyles.actions}>
                    <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => {
                        accountData.save({...accountData.data, active: true}).then(()=>router.dismiss());
                    }}>
                        <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function logoutPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");
    const accountData = useAsyncData(KEYS.accountData, defaultData.accountData);
    const userData = useAsyncData(KEYS.userData, defaultData.userData);

    const [isLogoutAvailable, setLogoutAvailable] = useState(false);
    setTimeout(()=>setLogoutAvailable(true), 3000);

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
                    <Image style={welcomeStyles.topViewImage} source={image} />
                </View>
                <View style={welcomeStyles.bottomView}>
                    <View style={welcomeStyles.bottomViewHeader}>
                        <Text style={welcomeStyles.bottomViewHeaderTitle}>{userData.data.name}</Text>
                    </View>
                    <View style={welcomeStyles.bottomViewBody}>
                        <Text style={welcomeStyles.bottomViewBodyText}>Are you sure you want to logout?{"\n"}This won't delete any data, but your classes won't sync anymore.</Text>
                    </View>
                </View>
                <View style={welcomeStyles.actions}>
                    <TouchableOpacity disabled={!isLogoutAvailable} style={{...welcomeStyles.actionsButton, backgroundColor: theme.caution, opacity: (isLogoutAvailable ? 1 : 0.5)}} onPress={() => {
                        accountData.save(defaultData.accountData).then(()=>router.dismiss());
                    }}>
                        <Text style={welcomeStyles.actionsButtonText}>Log out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default function accountScreen() {
    const params = useLocalSearchParams();
    const action = params.action as string;

    switch (action) {
        case "login":
            return loginPage();
        case "signup":
            return signupPage();
        case "loggedin":
            return loggedinPage();
        case "logout":
            return logoutPage();
        default:
            return loginPage();
    }
}