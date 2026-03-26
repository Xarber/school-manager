import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type Action = {
    title: string;
    onPress?: () => void;
}
type ActionMenuProps = {
    title?: string;
    items: Action[];
    itemsPerRow?: number;
}

export default function ActionMenu(props: ActionMenuProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    let itemsPerRow = props.itemsPerRow ?? 3;

    return (
        <View style={commonStyle.dashboardSection}>
            <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>
            <View style={[commonStyle.actionMenuContainer, { gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)` }]}>
                {props.items.map((item, index) => (
                    <Pressable key={index} style={({ pressed }) => [
                        commonStyle.actionMenuItemContainer,
                        pressed ? { opacity: 0.5 } : null
                    ]} onPress={item.onPress}>
                        <Text style={commonStyle.actionMenuItem}>{item.title}</Text>
                        <MaterialIcons style={{ marginLeft: "auto" }} name="arrow-forward-ios" size={16} color={theme.text} />
                    </Pressable>
                ))}
            </View>
        </View>
    )
}