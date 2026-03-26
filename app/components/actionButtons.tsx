import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTextColor } from "./dashboardItem";

interface ActionButtonsProps {
    items: {
        title: string;
        iconName: React.ComponentProps<typeof Ionicons>["name"];
        iconSize?: number;
        buffering?: boolean;
        enabled?: boolean;
        onPress: () => void;
        styles?: any;
        display?: boolean;
    }[],
    align?: "left" | "right";
    itemStyles?: any;
    containerStyles?: any;
}

export default function ActionButtons({ items, align, containerStyles, itemStyles }: ActionButtonsProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    align ??= "right";

    return (
        <View style={[
            {
                position: "absolute",
                bottom: insets.bottom + 20,
                flexDirection: "row",
                justifyContent: "center",
                gap: 10
            }, 
            align === "left" ? { left: 20 } : { right: 20 },
            containerStyles
        ]}>
            {items.map((e, i) => {
                if (e.display === false) return null;
                e.buffering ??= false;
                e.enabled ??= !e.buffering;
                let backgroundColor = e.styles?.backgroundColor ?? itemStyles?.backgroundColor ?? (!e.enabled ? theme.disabled : undefined) ?? commonStyle.button.backgroundColor;
                let textColor = getTextColor(backgroundColor);
                return <TouchableOpacity disabled={!e.enabled} key={i} style={[
                        commonStyle.button, 
                        {display: "flex", alignItems: "start",gap: 5, padding: 0, overflow: "hidden"},
                        itemStyles,
                        e.styles,
                        {backgroundColor}
                    ]} onPress={e.onPress}>
                        <BlurView style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5, padding: 10, flex: 1 }}>
                            {e.buffering ? <ActivityIndicator size="small" color={theme.text} /> : null}
                            {!e.buffering && <Ionicons name={e.iconName} size={e.iconSize ?? 30} color={textColor}></Ionicons>}
                            {!e.buffering && (e.title && <Text style={{ color: textColor, fontSize: 12, paddingRight: 10 }}>{e.title}</Text>)}
                        </BlurView>
                </TouchableOpacity>
            })}
        </View>
    );
}