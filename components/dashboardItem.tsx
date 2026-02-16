import { View, Text, Image, ImageSourcePropType, Pressable } from "react-native"
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/constants/useThemes"
import createStyling from "@/constants/styling";

type DashboardItemBadge = {
    text: string;
    color: string;
}
type DashboardItem = {
    title: string;
    description?: string;
    icon?: ImageSourcePropType;
    badge?: DashboardItemBadge;
}
type DashboardItemProps = {
    title: string;
    items: DashboardItem[];
    expand?: () => void;
}

export default function DashboardItem(props: DashboardItemProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View style={commonStyle.dashboardSection}>
            <Pressable onPress={props.expand} style={{display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 10}}>
                <View>
                    <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>
                    {props.expand && <Text style={{...commonStyle.text, fontSize: 14, color: theme.primary}}>See All</Text>}
                </View>
                {props.expand && (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme.primary} style={{ marginLeft: "auto" }} />
                )}
            </Pressable>
            <View style={commonStyle.dashboardSectionContainer}>
                {props.items.map((item, index) => (
                    <View key={index} style={commonStyle.dashboardSectionItem}>
                        {item.icon && <Image style={commonStyle.dashboardSectionItemIcon} source={item.icon} />}
                        <View style={commonStyle.dashboardSectionItemContent}>
                            <View style={commonStyle.dashboardSectionItemTextContainer}>
                                <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText}}>{item.title}</Text>
                                <Text style={commonStyle.text}>{item.description ?? "No Description"}</Text>
                            </View>
                            {item.badge && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemBadge, backgroundColor: item.badge.color}}>{item.badge.text}</Text>}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    )
}