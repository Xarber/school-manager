import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
                return <TouchableOpacity disabled={!e.enabled} key={i} style={[
                        commonStyle.button, 
                        {display: "flex", flexDirection: "row", alignItems: "center", gap: 5},
                        (!e.enabled ? { backgroundColor: theme.disabled} : null),
                        itemStyles,
                        e.styles
                    ]} onPress={e.onPress}>
                    {e.buffering ? <ActivityIndicator size="small" color={theme.text} /> : null}
                    {!e.buffering && <Ionicons name={e.iconName} size={e.iconSize ?? 30} color={theme.text}></Ionicons>}
                    {!e.buffering && (e.title && <Text style={{ color: theme.text, fontSize: 12, paddingRight: 10 }}>{e.title}</Text>)}
                </TouchableOpacity>
            })}
        </View>
    );
}