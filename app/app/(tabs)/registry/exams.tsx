import { Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/constants/i18n';

export default function ExamsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <Ionicons name="flask-sharp" size={40} color={theme.text} />
            <Text style={[commonStyle.headerText, {textAlign: "center"}]}>{i18n.t("beta.undeveloped.title")}</Text>
            <Text style={[commonStyle.text, {textAlign: "center"}]}>{i18n.t("beta.undeveloped.message")}</Text>
        </View>
    );
}