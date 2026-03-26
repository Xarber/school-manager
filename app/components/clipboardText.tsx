import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export interface ClipboardTextProps {
    text: string;
}

export default function ClipboardText(props: ClipboardTextProps) {
    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    const [iconName, setIconName] = useState("copy-outline");

    return (
        <View style={styles.clipboardTextContainer}>
            <Text selectable={true} style={styles.clipboardText}>{props.text}</Text>
            <TouchableOpacity style={styles.clipboardTextCopy} onPress={async()=>{
                await Clipboard.setStringAsync(props.text);
                setIconName("checkmark-sharp");
            }}>
                <Ionicons name={iconName as any} size={20} color={theme.text} />
            </TouchableOpacity>
        </View>
    )
}