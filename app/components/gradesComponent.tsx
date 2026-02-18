import { View, Text, Pressable } from "react-native"
import { useTheme } from "@/constants/useThemes"
import createStyling from "@/constants/styling";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

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
                    <Text style={commonStyle.dashboardSectionTitle}>{props.title ?? "Grades"}</Text>
                    {props.expand && <Text style={{...commonStyle.text, fontSize: 14, color: theme.primary}}>See All</Text>}
                </View>
                {props.expand && (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme.primary} style={{ marginLeft: "auto" }} />
                )}
            </Pressable>
            <View style={commonStyle.userGrades}>
                <Text style={renderedCount === 0 ? commonStyle.text : { display: "none" }}>{props.noItemsText ?? "Nothing to see here..."}</Text>
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