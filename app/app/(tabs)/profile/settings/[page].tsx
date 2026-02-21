import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function accountScreen() {
    const params = useLocalSearchParams();
    const action = params.action as string;

    switch (action) {
        default: 
            return <Text>Settings</Text>
    }
}