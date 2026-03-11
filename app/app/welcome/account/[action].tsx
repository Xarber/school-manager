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
import { useState } from "react";
import { useRouter, useLocalSearchParams, router, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { KeyboardShift } from "@/components/keyboardShift";
import { AlertProps, useAlert } from "@/components/alert/AlertContext";

export function validateEmail(email: string) {
    return !!String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
}

async function sendOtp(email: string, setotpsent: Function, setloading: Function, alert: {show: (props: AlertProps)=>void, hide: Function}) {
    setloading(true);

    const status = await fetch(DataManager.db.connect + DataManager.db.authenticate, {
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
        setloading(false);
        setotpsent(true);
    } else {
        setloading(false);
        alert.show({title: "Failed to send OTP code", message: status.message});
    }
}

async function verifyOtp(email: string, otpcode: string, reset: Function, alert: {show: (props: AlertProps)=>void, hide: Function}) {

    const status = await fetch(DataManager.db.connect + DataManager.db.authenticateOtp, {
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
                alert.show({title: "Error", message: "Invalid OTP code"});
                reset();
                break;
            case "Login failed":
                alert.show({title:"Error", message: "Unknown error. Please try again later."});
                break;
            default:
                alert.show({title: "Failed to verify OTP code", message: (status.message || status.error)});
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

    const accountData = useAppDataSync(DataManager.accountData.db, DataManager.accountData.app, DataManager.accountData.default);
    const [loading, setLoading] = useState(false);
    
    const alert = useAlert();

    const reset = () => {
        setOtpsent(false);
        setLoading(false);
        setOtpcode("");
    }

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <KeyboardShift>
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
                        <View style={welcomeStyles.actions}>
                            <TouchableOpacity disabled={!validateEmail(email) || loading} style={!validateEmail(email) ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} onPress={() => {
                                if (!otpsent) {
                                    sendOtp(email, setOtpsent, setLoading, alert);
                                } else {
                                    setLoading(true);
                                    verifyOtp(email, otpcode, reset, alert).then(status => {
                                        setLoading(false);
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
                                {loading ? (
                                    <ActivityIndicator size="small" />
                                ) : (
                                    <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                </ScrollView>
            </KeyboardShift>
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
    const [loading, setLoading] = useState(false);

    const alert = useAlert();

    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            <KeyboardShift>
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
                        <View style={welcomeStyles.actions}>
                            <TouchableOpacity disabled={!name || !surname || loading} style={(!name || !surname) ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} onPress={() => {
                                alert.show({
                                    title: "Is this correct?",
                                    message: `${name} ${surname}`, 
                                    actions: [
                                        {
                                            title: "Yes",
                                            onPress: () => {
                                                setLoading(true);
                                                userData.save({...userData.data, name: `${name} ${surname}`, userInfo: {...userData.data.userInfo, name, surname}}).then(() => {
                                                    setLoading(false);
                                                    router.replace("/welcome/account/loggedin");
                                                });
                                            }
                                        },
                                        {
                                            title: "No",
                                            onPress: () => {
                                                setName("");
                                                setSurname("");
                                            }
                                        },
                                    ]
                                });
                            }}>
                                {loading ? (
                                    <ActivityIndicator size="small" />
                                ) : (
                                    <Text style={welcomeStyles.actionsButtonText}>Continue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                </ScrollView>
            </KeyboardShift>
        </SafeAreaView>
    );
}

function loggedinPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");
    const accountData = useAppDataSync(DataManager.accountData.db, DataManager.accountData.app, DataManager.accountData.default);
    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            {userData.loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" />
                </View>
            ) : (
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
            )}
        </SafeAreaView>
    );
}

function logoutPage() {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const image = require("@/assets/images/welcome.png");
    const accountData = useAppDataSync(DataManager.accountData.db, DataManager.accountData.app, DataManager.accountData.default);
    const userData = useAppDataSync(DataManager.userData.db, DataManager.userData.app, DataManager.userData.default);

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
                        accountData.save(DataManager.accountData.default).then(()=>router.dismiss());
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