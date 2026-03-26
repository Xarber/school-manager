import i18n from "@/constants/i18n";
import createStyling from "@/constants/styling";
import { useTheme } from "@/constants/useThemes";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import { Pressable, Text, View } from "react-native";

type UserGrade = {
    title: string;
    grade: string | number;
}
type UserGradesProps = {
    title?: string;
    items: UserGrade[];
    maxItems?: number;
    noItemsText?: string;
    expand?: () => void;
}

export default function UserGrades(props: UserGradesProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const renderedCount = props.items.filter((item, index) => 
        props.maxItems === undefined || index < props.maxItems
    ).length;

    return (
        <View style={commonStyle.dashboardSection}>
            <Pressable onPress={props.expand} style={{display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 10}}>
                <View>
                    <Text style={commonStyle.dashboardSectionTitle}>{props.title ?? i18n.t("components.gradesComponent.title")}</Text>
                    {props.expand && <Text style={{...commonStyle.text, fontSize: 14, color: theme.primary}}>{i18n.t("components.gradesComponent.seeAll.text")}</Text>}
                </View>
                {props.expand && (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme.primary} style={{ marginLeft: "auto" }} />
                )}
            </Pressable>
            <View style={commonStyle.userGrades}>
                <Text style={renderedCount === 0 ? commonStyle.text : { display: "none" }}>{props.noItemsText ?? i18n.t("components.gradesComponent.empty.text")}</Text>
                {props.items.map((item, index) => {
                    if (props.maxItems === undefined || index < props.maxItems) {
                        return (
                            <View key={index} style={commonStyle.dashboardSectionItem}>
                                <Text style={commonStyle.text}>{item.title}</Text>
                                <Text style={commonStyle.text}>{item.grade}</Text>
                            </View>
                        );
                    }
                    return null;
                })}
            </View>
        </View>
    )
}