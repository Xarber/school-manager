import { View, Text, Image, ImageSourcePropType } from "react-native"
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/constants/useThemes"
import createStyling from "@/constants/styling";
import CircularProgress from 'react-native-circular-progress-indicator';

type Grade = {
    title: string;
    grade: number;
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
                {props.items.map((item, index) => {
                    const percentage = (item.grade / props.maxValue) * 100;
                    let colorIndex = "100%";
                    for (const key in colorMap) {
                        colorIndex = key;
                        if (percentage <= parseInt(key)) {
                            break;
                        }
                    }
                    return (
                        index < (props.maxItems ?? props.items.length) &&
                        <View key={index} style={{ alignItems: "center", justifyContent: "space-between", ...commonStyle.dashboardSectionItem}}>
                            <Text style={commonStyle.actionMenuItem}>{item.title}</Text>
                            <CircularProgress
                                value={item.grade}
                                maxValue={props.maxValue}

                                radius={20}
                                activeStrokeWidth={5}
                                inActiveStrokeWidth={7}

                                activeStrokeColor={colorMap[colorIndex] ?? "gray"}
                                progressValueColor="white"

                                progressValueFontSize={13}
                            />
                        </View>
                    )
                })}
            </View>
        </View>
    )
}