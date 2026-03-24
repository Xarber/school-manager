import { View, Text, Image, ImageSourcePropType, Pressable } from "react-native"
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/constants/useThemes"
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
    title?: string;
    items: DashboardItem[];
    maxItems?: number;
    noItemsText?: string;
    hideIfEmpty?: boolean;
    collapsed?: boolean;
    expand?: () => void;
}

export function getTextColor(bgColor: string) {
  // supports #RGB, #RRGGBB, rgb(...)
  let r, g, b;

  if (bgColor.startsWith("#")) {
    let hex = bgColor.slice(1);

    if (hex.length === 3) {
      hex = hex.split("").map(c => c + c).join("");
    }

    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  } else if (bgColor.startsWith("rgb")) {
    [r, g, b] = (bgColor.match(/\d+/g) as any).map(Number);
  }

  // perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // tweak threshold if needed
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
}

export default function DashboardItem(props: DashboardItemProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const renderedCount = props.items.filter((item, index) => 
        props.maxItems === undefined || index < props.maxItems
    ).length;

    return (
        <View style={[commonStyle.dashboardSection, {gap: 10}, props.hideIfEmpty && renderedCount === 0 ? {display: "none"} : null]}>
            {props.title && <Pressable onPress={props.expand} style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                <View>
                    <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>
                    {props.expand && <Text style={{...commonStyle.text, fontSize: 14, color: theme.primary}}>{i18n.t("components.dashboardItem.seeAll.text")}</Text>}
                </View>
                {props.expand && (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme.primary} style={{ marginLeft: "auto" }} />
                )}
            </Pressable>}
            <View style={[commonStyle.dashboardSectionContainer, props.collapsed ? {display: "none"} : null]}>
                <Text style={renderedCount === 0 ? commonStyle.text : { display: "none" }}>{props.noItemsText ?? i18n.t("components.dashboardItem.empty.text")}</Text>
                {props.items.map((item, index) => {
                    if ((props.maxItems === undefined || index < props.maxItems) && item) {
                        let badgeTextColor = theme.text;
                        if (item.badge) badgeTextColor = getTextColor(item.badge.color);
                        return (
                            <Pressable onPress={item.onPress} key={index} style={commonStyle.dashboardSectionItem}>
                                {item.icon && <Image style={commonStyle.dashboardSectionItemIcon} source={item.icon} />}
                                <View style={commonStyle.dashboardSectionItemContent}>
                                    <View style={commonStyle.dashboardSectionItemHeader}>
                                        <View style={commonStyle.dashboardSectionItemTextContainer}>
                                            <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText}}>{item.title}</Text>
                                            {item.subtitle && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText, ...commonStyle.dashboardSectionItemTextSubtitle}}>{item.subtitle}</Text>}
                                        </View>
                                        {item.badge && <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemBadge, backgroundColor: item.badge.color, color: badgeTextColor}}>{item.badge.text}</Text>}
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