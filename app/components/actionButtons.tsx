import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTextColor } from "./dashboardItem";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

export function addTransparency(color: string, alpha: number) {
    // alpha: 0 → fully transparent, 1 → opaque
    if (color.startsWith("#")) {
        let hex = color.replace("#", "");

        if (hex.length === 3) {
            hex = hex.split("").map(c => c + c).join("");
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }

    if (color.startsWith("rgba(")) {
        return color.replace(/rgba\(([^)]+),[^)]+\)/, `rgba($1, ${alpha})`);
    }

    return color; // fallback
}

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
    const liquidGlass = isLiquidGlassAvailable();

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
                backgroundColor = addTransparency(backgroundColor, liquidGlass ? 0.5 : 0.7);
                let textColor = getTextColor(backgroundColor);
                return (
                    <GlassView key={i} style={{ borderRadius: 360, overflow: "hidden" }}>
                        <BlurView intensity={liquidGlass ? 0 : 60}>
                            <TouchableOpacity disabled={!e.enabled} style={[
                                commonStyle.button, 
                                { display: "flex", flexDirection: "row", alignItems: "center", gap: 5, padding: 10, flex: 1, overflow: "hidden" },
                                itemStyles,
                                e.styles,
                                {backgroundColor}
                            ]} onPress={e.onPress}>
                                {e.buffering ? <ActivityIndicator size="small" color={theme.text} /> : null}
                                {!e.buffering && <Ionicons name={e.iconName} size={e.iconSize ?? 30} color={textColor}></Ionicons>}
                                {!e.buffering && (e.title && <Text style={{ color: textColor, fontSize: 12, paddingRight: 10 }}>{e.title}</Text>)}
                            </TouchableOpacity>
                        </BlurView>
                    </GlassView>
                )
            })}
        </View>
    );
}