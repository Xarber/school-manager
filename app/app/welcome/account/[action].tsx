import { 
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Pressable
} from "react-native";
import { Keyboard } from "react-native";
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams, router, Redirect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import { useAppDataSync, DataManager } from "@/data/datamanager";
import { KeyboardShift } from "@/components/keyboardShift";
import i18n from "@/constants/i18n";
import { useUserData } from "@/data/UserDataContext";
import { useAccountData } from "@/data/AccountDataContext";
import welcomeImage from "@/assets/images/welcome.png";
import { useNetworkContext } from "@/constants/NetworkContext";
import { useNetInfo } from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";

interface AlertProps {
    title: string;
    message: string;
    dismissable?: boolean;
    children?: React.ReactNode;
    actions?: {
        title: string;
        onPress?: () => void;
    }[];
}

interface RootAlertProps {
    title: string;
    message: string;
    dismissable?: boolean;
    children?: React.ReactNode;
    actions?: {
        title: string;
        onPress?: () => void;
    }[];
    hide: any
}

interface AccountProps {
    alert: {
        show: Function,
        hide: Function
    }
}

export function validateEmail(email: string) {
    return !!String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
}

async function sendOtp(email: string, setotpsent: Function, setloading: Function, alert: {show: (props: AlertProps)=>void, hide: Function}, serverpath: string) {
    setloading(true);

    const status = await fetch(serverpath + DataManager.db.authenticate, {
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

async function verifyOtp(email: string, otpcode: string, reset: Function, alert: {show: (props: AlertProps)=>void, hide: Function}, serverpath: string) {

    const status = await fetch(serverpath + DataManager.db.authenticateOtp, {
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

function LoginPage({alert}: AccountProps) {
    const router = useRouter();
    const network = useNetworkContext();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const [email, setEmail] = useState("");
    const [otpcode, setOtpcode] = useState("");
    const [otpsent, setOtpsent] = useState(false);

    const accountData = useAccountData();
    const [loading, setLoading] = useState(false);
    let safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    const reset = () => {
        setOtpsent(false);
        setLoading(false);
        setOtpcode("");
    }

    return (
        <KeyboardShift extraPadding={-safeAreaInsets.bottom + 20}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <View style={welcomeStyles.container}>
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
                                    <TextInput autoFocus autoCapitalize="none" maxLength={6} keyboardType="number-pad" style={welcomeStyles.bottomViewBodyFormFieldInput} value={otpcode} onChangeText={setOtpcode} placeholder={i18n.t("welcome.account.auth.input.otp.placeholder")} />
                                </View>
                            </View>
                        </View>
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
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
                </View>
            </ScrollView>
            <View style={[welcomeStyles.actions, {padding: 20, paddingBottom: safeAreaInsets.bottom, paddingTop: 10}]}>
                <TouchableOpacity disabled={!validateEmail(email) || loading || !network.ready || !network.serverReachable} style={(!validateEmail(email) || !network.serverReachable) ? {...welcomeStyles.actionsButton, backgroundColor: theme.disabled} : welcomeStyles.actionsButton} onPress={() => {
                    if (!otpsent) {
                        sendOtp(email, setOtpsent, setLoading, alert as any, (network.serverPath as string));
                    } else {
                        setLoading(true);
                        verifyOtp(email, otpcode, reset, alert as any, (network.serverPath as string)).then(status => {
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
                        <ActivityIndicator size="small" color={theme.text} />
                    ) : (
                        <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.auth.continue")}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardShift>
    );
}

function SignupPage({alert}: AccountProps) {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [loading, setLoading] = useState(false);

    const userData = useUserData();

    let safeAreaInsets = useSafeAreaInsets();
    if (safeAreaInsets.bottom == 0) safeAreaInsets.bottom = 20;

    return (
        <KeyboardShift extraPadding={-safeAreaInsets.bottom + 20}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <View style={welcomeStyles.container}>
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
                </View>
            </ScrollView>
            <View style={[welcomeStyles.actions, {padding: 20, paddingBottom: safeAreaInsets.bottom, paddingTop: 10}]}>
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
                        <ActivityIndicator size="small" color={theme.text} />
                    ) : (
                        <Text style={welcomeStyles.actionsButtonText}>{i18n.t("welcome.account.signup.continue")}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardShift>
    );
}

function LoggedInPage({alert}: AccountProps) {
    const router = useRouter();

    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

    const accountData = useAccountData();
    const userData = useUserData();

    useEffect(() => {
        userData.load();
    }, []);

    return (
        <SafeAreaView
            style={welcomeStyles.container}
            edges={["bottom", "left", "right", "top"]}
        >
            {userData.loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" color={theme.text} />
                </View>
            ) : (
                <ScrollView 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View style={welcomeStyles.topView}>
                        <Image style={welcomeStyles.topViewImage} source={welcomeImage} />
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

function LogoutPage({alert}: AccountProps) {
    const router = useRouter();

    const theme = useTheme(); // "dark"
    const styles = createStyling.createCommonStyles(theme);
    const welcomeStyles = createStyling.createWelcomescreenStyles(theme);

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
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View style={welcomeStyles.topView}>
                    <Image style={welcomeStyles.topViewImage} source={welcomeImage} />
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

function AlertComponent(alertProps: RootAlertProps) {
    const colors = useTheme();
    const styles = createStyling.createAlertStyles(colors);

    return (
        <>
            <Pressable style={styles.container} onPress={alertProps.dismissable ? alertProps.hide : undefined}>
                <Pressable style={styles.alert} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.alertHeaderText}>{alertProps.title}</Text>

                    <View style={styles.alertContent}>
                    <Text style={styles.alertText}>{alertProps.message}</Text>
                        {alertProps.children}
                    </View>

                    <View style={styles.alertActions}>
                        {alertProps.actions?.slice(0,2).map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.alertButton, {backgroundColor: i === 0 ? colors.primary : colors.secondary}]}
                                onPress={() => {
                                    action.onPress?.();
                                    alertProps.hide();
                                }}
                            >
                                <Text style={styles.alertButtonText}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                        {(alertProps.actions ?? []).length === 0 && (
                            <TouchableOpacity
                                style={[styles.alertButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    alertProps.hide();
                                }}
                            >
                                <Text style={styles.alertButtonText}>{i18n.t("components.alert.close.default.text")}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Pressable>
            </Pressable>
        </>
    )
}

export default function AccountScreen() {
    const params = useLocalSearchParams();
    const action = params.action as string;

    const [visible, setVisible] = useState(false);
    const [alertProps, setAlertProps] = useState<AlertProps | null>(null);

    const show = (props: AlertProps) => {
        Keyboard.dismiss();
        if (props.dismissable === undefined && !props.actions) props.dismissable = true;
        else if (!!props.actions) props.dismissable = false;
        setAlertProps(props);
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    if (action === "login" || action === "signup" ) {
        return (
            <>
                {action === "login" && <LoginPage alert={{show, hide}} />}
                {action === "signup" && <SignupPage alert={{show, hide}} />}
                {visible && alertProps && (<AlertComponent title={alertProps.title} message={alertProps.message} dismissable={alertProps.dismissable} children={alertProps.children} actions={alertProps.actions} hide={hide} />)}
            </>
        )
    };

    return (
        <SafeAreaView
            style={{flex: 1}}
            edges={["bottom", "left", "right", "top"]}
        >
            {action === "loggedin" && <LoggedInPage alert={{show, hide}} />}
            {action === "logout" && <LogoutPage alert={{show, hide}} />}
            {visible && alertProps && (<AlertComponent title={alertProps.title} message={alertProps.message} dismissable={alertProps.dismissable} children={alertProps.children} actions={alertProps.actions} hide={hide} />)}
        </SafeAreaView>
    );
}