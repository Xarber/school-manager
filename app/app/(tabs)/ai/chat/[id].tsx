import { View, Text } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import { useRouter, useLocalSearchParams } from 'expo-router';
import createStyling from '@/constants/styling';

export default function ChatScreen() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);
    const params = useLocalSearchParams();
    const chatId = params.id as string;
    const router = useRouter();
    // You can use chatId to fetch chat data or perform other actions related to this specific chat

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={commonStyle.text}>This is the chat screen for chat ID: {chatId}</Text>
        </View>
    );
}