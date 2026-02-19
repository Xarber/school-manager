import { View, Text, Image, ImageSourcePropType } from "react-native"
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/constants/useThemes"
import createStyling from "@/constants/styling";
import CircularProgress from 'react-native-circular-progress-indicator';

type Grade = {
    title: string;
    grade: string | number;
}
type GradeGridProps = {
    title?: string;
    maxItems?: number;
    maxValue: number;
    items: Grade[];
}

export default function GradeGrid(props: GradeGridProps) {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    const colorMap: { [key: string]: string } = {
        "49%": "red",
        "59%": "orange",
        "65%": "yellow",
        "79%": "green",
        "89%": "lightgreen",
        "100%": "dodgerblue",
    };

    return (
        <View style={commonStyle.dashboardSection}>
            {props.title && <Text style={commonStyle.dashboardSectionTitle}>{props.title}</Text>}
            <View style={commonStyle.dashboardSectionContainer}>
                <Text style={props.items.length === 0 ? commonStyle.text : { display: "none" }}>Nothing to see here...</Text>
                {props.items.map((item, index) => {
                    let colorIndex = "100%";
                    if (typeof item.grade === "number") {
                        const percentage = (item.grade / props.maxValue) * 100;
                        for (const key in colorMap) {
                            colorIndex = key;
                            if (percentage <= parseInt(key)) {
                                break;
                            }
                        }
                    }
                    return (
                        index < (props.maxItems ?? props.items.length) &&
                        <View key={index} style={{ alignItems: "center", justifyContent: "space-between", ...commonStyle.dashboardSectionItem}}>
                            <Text style={commonStyle.actionMenuItem}>{item.title}</Text>
                            <CircularProgress
                                value={(typeof item.grade === "number") ? item.grade : props.maxValue}
                                maxValue={props.maxValue}

                                radius={20}
                                activeStrokeWidth={5}
                                inActiveStrokeWidth={7}

                                activeStrokeColor={((typeof item.grade === "number") ? colorMap[colorIndex] : theme.action) ?? theme.action}
                                progressValueColor={theme.text}
                                title={typeof item.grade === "string" ? item.grade.substring(0, 1) : ``}
                                progressValueStyle={typeof item.grade === "string" ? {display: "none"} : {}}
                                titleStyle={typeof item.grade === "string" ? {fontSize: 18, margin: 0, fontWeight: 500, color: theme.text} : {}}

                                progressValueFontSize={13}
                            />
                        </View>
                    )
                })}
            </View>
        </View>
    )
}