import { View, Text, Image, ImageSourcePropType, Pressable } from "react-native"
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/constants/useThemes"
import { useState } from "react";
import createStyling from "@/constants/styling";
import i18n from "@/constants/i18n";

type DashboardItemBadge = {
    text: string;
    color: string;
}
type DashboardItem = {
    title: string;
    subtitle?: string;
    description?: string;
    icon?: ImageSourcePropType;
    badge?: DashboardItemBadge;
    onPress?: () => void;
}
type DashboardItemProps = {
    title: string;
    items: DashboardItem[];
    maxItems?: number;
    noItemsText?: string;
    hideIfEmpty?: boolean;
    collapsed?: boolean;
    expand?: () => void;
}

export default function DashboardItem(props: DashboardItemProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const renderedCount = props.items.filter((item, index) => 
        props.maxItems === undefined || index < props.maxItems
    ).length;

    return (
        <View style={[commonStyle.dashboardSection, {gap: 10}, props.hideIfEmpty && renderedCount === 0 ? {display: "none"} : null]}>
            <Pressable onPress={props.expand} style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                <View>
                    <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>
                    {props.expand && <Text style={{...commonStyle.text, fontSize: 14, color: theme.primary}}>{i18n.t("components.dashboardItem.seeAll.text")}</Text>}
                </View>
                {props.expand && (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme.primary} style={{ marginLeft: "auto" }} />
                )}
            </Pressable>
            <View style={[commonStyle.dashboardSectionContainer, props.collapsed ? {display: "none"} : null]}>
                <Text style={renderedCount === 0 ? commonStyle.text : { display: "none" }}>{props.noItemsText ?? i18n.t("components.dashboardItem.empty.text")}</Text>
                {props.items.map((item, index) => {
                    if ((props.maxItems === undefined || index < props.maxItems) && item) {
                        return (
                            <Pressable onPress={item.onPress} key={index} style={commonStyle.dashboardSectionItem}>
                                {item.icon && <Image style={commonStyle.dashboardSectionItemIcon} source={item.icon} />}
                                <View style={commonStyle.dashboardSectionItemContent}>
                                    <View style={commonStyle.dashboardSectionItemHeader}>
                                        <View style={commonStyle.dashboardSectionItemTextContainer}>
                                            <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText}}>{item.title}</Text>
                                            {item.subtitle && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText, ...commonStyle.dashboardSectionItemTextSubtitle}}>{item.subtitle}</Text>}
                                        </View>
                                        {item.badge && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemBadge, backgroundColor: item.badge.color}}>{item.badge.text}</Text>}
                                    </View>
                                    <Text style={commonStyle.text}>{item.description ?? i18n.t("components.dashboardItem.item.nodescription.text")}</Text>
                                </View>
                            </Pressable>
                        );
                    }
                    return null;
                })}
            </View>
        </View>
    )
}