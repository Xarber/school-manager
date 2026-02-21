import { View, ScrollView, Text } from 'react-native';
import { useTheme } from '@/constants/useThemes';
import createStyling from '@/constants/styling';

export default function Comunications() {
    const theme = useTheme();
    const styles = createStyling.createCommonStyles(theme);
    return (
        <View style={styles.dashboardSection}>
            <ScrollView>
                <Text style={styles.text}>Comunications</Text>
            </ScrollView>
        </View>
    );
}