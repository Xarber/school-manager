import { useTheme } from "@/constants/useThemes";
import createStyling from "@/constants/styling";
import { TouchableOpacity, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
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
    break?: boolean;
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
    renderSmallTime?: boolean;
    renderBreaks?: boolean;
}

export default function Timeline(props: TimelineProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    if (props.renderBreaks != false) {
        for (let i = 0;i < props.periods.length;i++) {
            if (props.periods[i + 1] == null) break;
            if (props.periods[i + 1].startTime != props.periods[i].endTime) {
                const [h1, m1] = props.periods[i].endTime.split(":").map(Number);
                const [h2, m2] = props.periods[i + 1].startTime.split(":").map(Number);
                const [d1, d2] = [new Date(), new Date()];

                d1.setHours(h1, m1, 0, 0);
                d2.setHours(h2, m2, 0, 0);

                if (d1.getTime() > d2.getTime()) continue;

                props.periods.splice(i + 1, 0, {
                    startTime: props.periods[i].endTime,
                    endTime: props.periods[i + 1].startTime,
                    break: true,
                    items: []
                });
            }
        }
    }

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
            <View style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 50 }}>
                {/* Start Time */}
                {!period.break && <Text style={[commonStyle.text, { marginBottom: 15 }]}>{period.startTime}</Text>}

                {/* Divider */}
                <View style={[{ flex: 1, borderRadius: 360, display: "flex", justifyContent: "center", alignItems: "center" }, !period.break ? {minHeight: 50, width: 2, backgroundColor: theme.disabled} : {minHeight: 80, opacity: 0.4}]}>
                    <Feather name={"x"} size={20} color={theme.disabled} />
                </View>

                {/* End Time */}
                {!period.break && <Text style={[commonStyle.text, { marginTop: 17, marginBottom: 2 }]}>{period.endTime}</Text>}
            </View>
            <View style={[{ flex: 1, display: "flex", flexDirection: "row", gap: 5 }]}>
                <View style={{ flex: 1, gap: 10 }}>
                    {period.break ? null : period.items.map(( item, index ) => {
                        return <TimelineItem key={index} item={item} index={index} />
                    })}
                    {(period.break || period.items.length == 0) && (
                        <View style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <Ionicons name="albums-outline" size={20} color={theme.disabled} />
                            <Text style={[commonStyle.text, { color: theme.disabled }]}>{i18n.t("components.timeline.noitems")}</Text>
                        </View>
                    )}
                    {!period.break && props.edit?.editing && (
                        <TouchableOpacity onPress={() => props.edit?.addItem({ startTime: period.startTime, endTime: period.endTime })} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <Ionicons name="add" size={20} color={theme.text} />
                            <Text style={commonStyle.text}>{i18n.t("components.timeline.add.text")}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{ display: !props.renderSmallTime ? "none" : "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <Text style={{color: theme.disabled, fontSize: 12}}>{period.startTime}</Text>
                    <View style={{ flex: 1 }}></View>
                    <Text style={{color: theme.disabled, fontSize: 12}}>{period.endTime}</Text>
                </View>
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