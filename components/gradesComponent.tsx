import { View, Text, Pressable } from "react-native"
import { useTheme } from "@/constants/useThemes"
import createStyling from "@/constants/styling";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

type UserGrade ={
    course: string;
    grade: number;
}
type UserGradesProps = {
    items: UserGrade[];
    expand?: () => void;
}

export default function UserGrades(props: UserGradesProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View style={commonStyle.dashboardSection}>
            <Pressable onPress={props.expand} style={{display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 10}}>
                <View>
                    <Text style={commonStyle.dashboardSectionTitle}>Grades</Text>
                    {props.expand && <Text style={{...commonStyle.text, fontSize: 14, color: theme.primary}}>See All</Text>}
                </View>
                {props.expand && (
                    <MaterialIcons name="arrow-forward-ios" size={16} color={theme.primary} style={{ marginLeft: "auto" }} />
                )}
            </Pressable>
            <View style={commonStyle.userGrades}>
                {props.items.map((item, index) => (
                    <View key={index} style={commonStyle.dashboardSectionItem}>
                        <Text style={commonStyle.text}>{item.course}</Text>
                        <Text style={commonStyle.text}>{item.grade}</Text>
                    </View>
                ))}
            </View>
        </View>
    )
}