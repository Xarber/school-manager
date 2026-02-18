import { Text, View } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';

export default function ComunicationsTab() {
    const theme = useTheme();
    const commonStyle = createStyling.createCommonStyles(theme);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={commonStyle.text}>This is the comunications screen.</Text>
        </View>
    );
}