import { View, Text, TextInput } from "react-native";
import { useTheme } from "@/constants/useThemes";
import createStyles from "@/constants/styling";

type LoginComponentProps = {
    step: "enterEmail" | "enterCode" | "resetPassword";
    setStep: (step: "enterEmail" | "enterCode" | "resetPassword") => void;
};

export default function PasswordReset(props: LoginComponentProps) {
    const theme = useTheme();
    const loginStyles = createStyles.createUserLoginStyles(theme);
    const commonStyles = createStyles.createCommonStyles(theme);

    switch (props.step) {
        case "enterEmail":
            return (
                <View style={loginStyles.container}>
                    <Text style={commonStyles.headerText}>Forgot Password</Text>
                    <View>
                        <View>
                            <Text style={commonStyles.text}>Email</Text>
                        </View>
                        <TextInput style={loginStyles.input}></TextInput>
                    </View>
                    <View>
                        <Text style={loginStyles.buttonText} onPress={() => props.setStep("enterCode")}>Confirm</Text>
                    </View>
                </View>
            );
        case "enterCode":
            return (
                <View style={loginStyles.container}>
                    <Text style={commonStyles.headerText}>Enter Code</Text>
                    <View>
                        <View>
                            <Text style={commonStyles.text}>Email</Text>
                        </View>
                        <TextInput style={loginStyles.input}></TextInput>
                    </View>
                    <View>
                        <Text style={loginStyles.buttonText} onPress={() => props.setStep("resetPassword")}>Confirm</Text>
                    </View>
                </View>
            );
        case "resetPassword":
            return (
                <View style={loginStyles.container}>
                    <Text style={commonStyles.headerText}>Reset Password</Text>
                    <View>
                        <View>
                            <Text style={commonStyles.text}>New Password</Text>
                        </View>
                        <TextInput style={loginStyles.input} secureTextEntry></TextInput>
                        
                        <View>
                            <Text style={loginStyles.buttonText}>Confirm</Text>
                        </View>
                        <TextInput style={loginStyles.input} secureTextEntry></TextInput>
                    </View>
                </View>
            );
        default:
            return null;
    }
}