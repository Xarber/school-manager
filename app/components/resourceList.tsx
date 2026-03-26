import i18n from "@/constants/i18n";
import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type ResourceItem = {
    title: string;
    description?: string;
    icon: "file" | "website" | "folder";
    collapsed?: boolean;
    onPress?: () => void;
}
type ResourceListProps = {
    title: string;
    folders?: ResourceItem[];
    items?: ResourceItem[];
    maxItems?: number;
    noItemsText?: string;
    hideIfEmpty?: boolean;
    collapsed?: boolean;
}

export default function ResourceList(props: ResourceListProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const renderedItemsCount = (props.items ?? []).filter((item, index) => 
        props.maxItems === undefined || index < props.maxItems
    ).length;
    const renderedFoldersCount = (props.folders ?? []).filter((item, index) => 
        props.maxItems === undefined || index < props.maxItems
    ).length;
    const renderedCount = renderedItemsCount + renderedFoldersCount;

    return (
        <View style={[commonStyle.dashboardSection, {gap: 10}, props.hideIfEmpty && renderedCount === 0 ? {display: "none"} : null]}>
            <View style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                <View>
                    <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>
                </View>
            </View>
            {props.folders && <View style={[commonStyle.dashboardSectionContainer, props.collapsed ? {display: "none"} : null]}>
                <Text style={renderedFoldersCount === 0 ? commonStyle.text : { display: "none" }}>{props.noItemsText ?? i18n.t("components.dashboardItem.empty.text")}</Text>
                {props.folders.map((item, index) => {
                    if ((props.maxItems === undefined || index < props.maxItems) && item) {
                        return (
                            <Pressable onPress={item.onPress} key={index} style={commonStyle.dashboardSectionItem}>
                                <Ionicons name={item.icon === "file" ? "document-text" : item.icon === "website" ? "globe-outline" : "folder"} size={24} color={theme.text} />
                                <View style={commonStyle.dashboardSectionItemContent}>
                                    <View style={commonStyle.dashboardSectionItemHeader}>
                                        <View style={commonStyle.dashboardSectionItemTextContainer}>
                                            <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText}}>{item.title}</Text>
                                        </View>
                                    </View>
                                    <Text style={commonStyle.text}>{item.description ?? i18n.t("components.dashboardItem.item.nodescription.text")}</Text>
                                </View>
                            </Pressable>
                        );
                    }
                    return null;
                })}
            </View>}
            {props.items && <View style={[commonStyle.dashboardSectionContainer, props.collapsed ? {display: "none"} : null]}>
                <Text style={renderedItemsCount === 0 ? commonStyle.text : { display: "none" }}>{props.noItemsText ?? i18n.t("components.dashboardItem.empty.text")}</Text>
                {props.items.map((item, index) => {
                    if ((props.maxItems === undefined || index < props.maxItems) && item) {
                        return (
                            <Pressable onPress={item.onPress} key={index} style={commonStyle.dashboardSectionItem}>
                                <Ionicons name={item.icon === "file" ? "document-text" : item.icon === "website" ? "globe-outline" : "folder"} size={24} color={theme.text} />
                                <View style={commonStyle.dashboardSectionItemContent}>
                                    <View style={commonStyle.dashboardSectionItemHeader}>
                                        <View style={commonStyle.dashboardSectionItemTextContainer}>
                                            <Text style={{...commonStyle.text, ...commonStyle.dashboardSectionItemText}}>{item.title}</Text>
                                        </View>
                                    </View>
                                    <Text style={commonStyle.text}>{item.description ?? i18n.t("components.dashboardItem.item.nodescription.text")}</Text>
                                </View>
                            </Pressable>
                        );
                    }
                    return null;
                })}
            </View>}
        </View>
    )
}