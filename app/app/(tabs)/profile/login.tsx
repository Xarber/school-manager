import { View } from "react-native";
import LoginComponent from "@/components/login";
import { useState } from "react";


export default function LoginTab() {
    const [loginMode, setLoginMode] = useState<"login" | "signup" | "forgotPassword">("login");
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <LoginComponent mode={loginMode} setMode={setLoginMode} />
        </View>
    )
}