import { View, Text, TextInput } from "react-native";
import { useTheme } from "@/constants/useThemes";
import PasswordReset from "./passwordReset";
import createStyles from "@/constants/styling";
import { useState } from "react";

type LoginComponentProps = {
    mode: "login" | "signup" | "forgotPassword";
    setMode?: (mode: "login" | "signup" | "forgotPassword") => void;
};

export default function LoginComponent(props: LoginComponentProps) {
    const theme = useTheme();
    const loginStyles = createStyles.createUserLoginStyles(theme);
    const commonStyles = createStyles.createCommonStyles(theme);

    const [passwordResetStep, setPasswordResetStep] = useState<"enterEmail" | "enterCode" | "resetPassword">("enterEmail");

    switch (props.mode) {
        case "login":
            return (
                <View style={loginStyles.container}>
                    <Text style={commonStyles.headerText}>Log In</Text>
                    <View>
                        <View>
                            <Text style={commonStyles.text}>Email</Text>
                        </View>
                        <TextInput style={loginStyles.input}></TextInput>

                        <View>
                            <Text style={commonStyles.text}>Password</Text>
                         </View>
                        <TextInput style={loginStyles.input}></TextInput>
                    </View>
                    <View>
                        <Text style={loginStyles.buttonText}>Login</Text>
                    </View>
                    <View>
                        <Text style={commonStyles.text} onPress={() => props.setMode && props.setMode("signup")}>Don't have an account? Sign Up</Text>
                        <Text style={commonStyles.text} onPress={() => props.setMode && props.setMode("forgotPassword")}>Forgot Password?</Text>
                    </View>
                </View>
            );
        case "signup":
            return (
                <View style={loginStyles.container}>
                    <Text style={commonStyles.headerText}>Sign Up</Text>
                    <View>
                        <View>
                            <Text style={commonStyles.text}>Email</Text>
                        </View>
                        <TextInput style={loginStyles.input}></TextInput>

                        <View>
                            <Text style={commonStyles.text}>Name and Surname</Text>
                        </View>
                        <View>
                            <TextInput style={loginStyles.input}></TextInput>
                            <TextInput style={loginStyles.input}></TextInput>
                        </View>

                        <View>
                            <Text style={commonStyles.text}>Password</Text>
                        </View>
                        <TextInput style={loginStyles.input} secureTextEntry></TextInput>
                        
                        <View>
                            <Text style={commonStyles.text}>Confirm Password</Text>
                        </View>
                        <TextInput style={loginStyles.input} secureTextEntry></TextInput>
                    </View>
                    <View>
                        <Text style={loginStyles.buttonText}>Sign Up</Text>
                    </View>
                    <View>
                        <Text style={commonStyles.text} onPress={() => props.setMode && props.setMode("login")}>Already registered? Log In</Text>
                    </View>
                </View>
            );
        case "forgotPassword":
            return (
                <View style={loginStyles.container}>
                    <PasswordReset step={passwordResetStep} setStep={setPasswordResetStep} />
                    <View>
                        <Text style={commonStyles.text} onPress={() => props.setMode && props.setMode("signup")}>Don't have an account? Sign Up</Text>
                        <Text style={commonStyles.text} onPress={() => props.setMode && props.setMode("forgotPassword")}>Forgot Password?</Text>
                    </View>
                </View>
            );
        default:
            return null;
    }
}