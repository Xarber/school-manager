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
import i18n from "@/constants/i18n";
import { useUserData } from "@/data/UserDataContext";
import { useAccountData } from "@/data/AccountDataContext";

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
        alert.show({title: i18n.t("welcome.account.error.otpsendfail.title"), message: status.message});
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
                alert.show({title: i18n.t("welcome.account.error.generic.title"), message: i18n.t("welcome.account.error.otpinvalid")});
                reset();
                break;
            case "Login failed":
                alert.show({title: i18n.t("welcome.account.error.generic.title"), message: i18n.t("welcome.account.error.generic.description")});
                break;
            default:
                alert.show({title: i18n.t("welcome.account.error.otpverifyfail.title"), message: (status.message || status.error)});
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

    const accountData = useAccountData();
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
                            <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.account.auth.title")}</Text>
                        </View>
                        <View style={welcomeStyles.bottomViewBody}>
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.auth.description")}</Text>
                            <View style={welcomeStyles.bottomViewBodyForm}>
                                <View style={welcomeStyles.bottomViewBodyFormField}>
                                    <Text style={welcomeStyles.bottomViewBodyFormFieldText}>{i18n.t("welcome.account.auth.input.email.title")}</Text>
                                    <TextInput autoCapitalize="none" keyboardType="email-address" style={welcomeStyles.bottomViewBodyFormFieldInput} value={email} onChangeText={(text)=>{reset(); setEmail(text);}} placeholder={i18n.t("welcome.account.auth.input.email.placeholder")} />
                                </View>
                                <View style={!otpsent ? {display: "none"} : welcomeStyles.bottomViewBodyFormField}>
                                    <Text style={welcomeStyles.bottomViewBodyFormFieldText}>{i18n.t("welcome.account.auth.input.otp.title")}</Text>
                                    <TextInput autoCapitalize="none" maxLength={6} keyboardType="number-pad" style={welcomeStyles.bottomViewBodyFormFieldInput} value={otpcode} onChangeText={setOtpcode} placeholder={i18n.t("welcome.account.auth.input.otp.placeholder")} />
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
                                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.auth.continue")}</Text>
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

    const userData = useUserData();

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
                            <Text style={welcomeStyles.bottomViewHeaderTitle}>{i18n.t("welcome.account.signup.title")}</Text>
                        </View>
                        <View style={welcomeStyles.bottomViewBody}>
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.signup.description")}</Text>
                            <View style={welcomeStyles.bottomViewBodyForm}>
                                <View style={welcomeStyles.bottomViewBodyFormField}>
                                    <Text style={welcomeStyles.bottomViewBodyFormFieldText}>{i18n.t("welcome.account.signup.input.name.title")}</Text>
                                    <TextInput maxLength={30} autoCapitalize="words" style={welcomeStyles.bottomViewBodyFormFieldInput} value={name} onChangeText={setName} placeholder={i18n.t("welcome.account.signup.input.name.placeholder")} />
                                </View>
                                <View style={welcomeStyles.bottomViewBodyFormField}>
                                    <Text style={welcomeStyles.bottomViewBodyFormFieldText}>{i18n.t("welcome.account.signup.input.surname.title")}</Text>
                                    <TextInput maxLength={40} autoCapitalize="words" style={welcomeStyles.bottomViewBodyFormFieldInput} value={surname} onChangeText={setSurname} placeholder={i18n.t("welcome.account.signup.input.surname.placeholder")} />
                                </View>
                            </View>
                        </View>
                    </View>
                        <View style={welcomeStyles.actions}>
                            <TouchableOpacity disabled={!name || !surname || loading} style={(!name || !surname) ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} onPress={() => {
                                alert.show({
                                    title: i18n.t("welcome.account.signup.confirm.title"),
                                    message: `${name} ${surname}`, 
                                    actions: [
                                        {
                                            title: i18n.t("welcome.account.signup.confirm.true"),
                                            onPress: () => {
                                                setLoading(true);
                                                userData.save({...userData.data, name: `${name} ${surname}`, userInfo: {...userData.data.userInfo, name, surname}}).then(() => {
                                                    setLoading(false);
                                                    router.replace("/welcome/account/loggedin");
                                                });
                                            }
                                        },
                                        {
                                            title: i18n.t("welcome.account.signup.confirm.false"),
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
                                    <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.signup.continue")}</Text>
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
    const accountData = useAccountData();
    const userData = useUserData();

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
                            <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.auth.success.title")}</Text>
                        </View>
                    </View>
                    <View style={welcomeStyles.actions}>
                        <TouchableOpacity style={welcomeStyles.actionsButton} onPress={() => {
                            accountData.save({...accountData.data, active: true}).then(()=>router.dismiss());
                        }}>
                            <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.auth.success.continue")}</Text>
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
    const accountData = useAccountData();
    const userData = useUserData();

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
                        <Text style={welcomeStyles.bottomViewBodyText}>{i18n.t("welcome.account.logout.description")}</Text>
                    </View>
                </View>
                <View style={welcomeStyles.actions}>
                    <TouchableOpacity disabled={!isLogoutAvailable} style={{...welcomeStyles.actionsButton, backgroundColor: theme.caution, opacity: (isLogoutAvailable ? 1 : 0.5)}} onPress={() => {
                        accountData.save(DataManager.accountData.default).then(()=>router.dismiss());
                    }}>
                        <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.logout.continue")}</Text>
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