import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import { getTextColor } from "./dashboardItem";
import i18n from "@/constants/i18n";

interface TimelineItem {
    title: string;
    subtitle?: string;
    description?: string;
    badge?: {
        text: string;
        color: string;
    }
    onPress?: () => any;
}

interface TimelinePeriod {
    startTime: string;
    endTime: string;
    items: TimelineItem[];
}

interface TimelineProps {
    edit?: {
        editing: boolean;
        addItem: (e: { startTime: string, endTime: string }) => void;
        addPeriod: () => void;
    }
    title?: string;
    periods: TimelinePeriod[];
}

export default function Timeline(props: TimelineProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View style={{ padding: 10 }}>
            {props.title && <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>}
            {props.periods.map((period, index) => {
                return <TimelinePeriod key={index} period={period} props={props} index={index} />
            })}
            {props.edit?.editing && (
                <TouchableOpacity onPress={() => {
                    props.edit?.addPeriod();
                }} style={[commonStyle.dashboardSectionItem, { marginTop: 10, display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <Ionicons name="add" size={24} color={theme.text} />
                    <Text style={commonStyle.text}>{i18n.t("components.timeline.addPeriod")}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

function TimelinePeriod({period, props, index}: {period: TimelinePeriod, props: TimelineProps, index: number}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View key={index} style={[{ display: "flex", flexDirection: "row", padding: 10, gap: 20 }, ((props.periods[index - 1]) && (props.periods[index - 1].endTime !== period.startTime)) ? { marginTop: 20 } : null]}>
            <View style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                {((!props.periods[index - 1]) || (props.periods[index - 1].endTime !== period.startTime)) && <Text style={[commonStyle.text, { marginBottom: 15 }]}>{period.startTime}</Text>}
                <View style={{ flex: 1, minHeight: 50, width: 2, borderRadius: 360, backgroundColor: theme.disabled }}></View>
                <Text style={[commonStyle.text, { marginTop: 17, marginBottom: 2 }]}>{period.endTime}</Text>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
                {period.items.map(( item, index ) => {
                    return <TimelineItem key={index} item={item} index={index} />
                })}
                {props.edit?.editing && (
                    <TouchableOpacity onPress={() => props.edit?.addItem({ startTime: period.startTime, endTime: period.endTime })} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons name="add" size={20} color={theme.text} />
                        <Text style={commonStyle.text}>{i18n.t("components.timeline.add.text")}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

function TimelineItem({item, index}: {item: TimelineItem, index: number}) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <Pressable onPress={item.onPress} key={index} style={commonStyle.dashboardSectionItem}>
            <View style={commonStyle.dashboardSectionItemContent}>
                <View style={commonStyle.dashboardSectionItemHeader}>
                    <View style={commonStyle.dashboardSectionItemTextContainer}>
                        <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText}}>{item.title}</Text>
                        {item.subtitle && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText, ...commonStyle.dashboardSectionItemTextSubtitle}}>{item.subtitle}</Text>}
                    </View>
                    {item.badge && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemBadge, backgroundColor: item.badge.color, color: getTextColor(item.badge.color)}}>{item.badge.text}</Text>}
                </View>
                {item.description && <Text style={commonStyle.text}>{item.description}</Text>}
            </View>
        </Pressable>
    )
}