import { Stack } from 'expo-router';
import i18n from '@/constants/i18n';
import { useTheme } from '@/constants/useThemes';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileLayout() {
  const theme = useTheme();
  return (
    <LinearGradient
        colors={theme.appThemeGradient.colors}
        start={theme.appThemeGradient.start}
        end={theme.appThemeGradient.end}
        style={{ flex: 1, opacity: theme.appThemeGradient.opacity ?? 1 }}
    >
      <BlurView style={{ flex: 1 }} intensity={60} tint={theme.type}>
        <Stack screenOptions={{ headerStyle: { backgroundColor: theme.surface.toString() }, contentStyle: { backgroundColor: "transparent" } }}>
          <Stack.Screen name="index" options={{ title: i18n.t("profile.stack.title")}} />
          <Stack.Screen name="settings/[page]" options={{ title: i18n.t("profile.settings.stack.title"), headerShown: true }} />
          <Stack.Screen name="class/[id]" options={{ headerShown: true, title: i18n.t("profile.class.stack.stacktitle"), headerTitle: i18n.t("profile.class.stack.title") }} />
          <Stack.Screen name="profiledata" options={{ presentation: "modal", headerShown: true, title: i18n.t("profile.stack.title"), headerStyle: { backgroundColor: "" }, contentStyle: { backgroundColor: theme.opaqueCard } }} />
        </Stack>
      </BlurView>
    </LinearGradient>
  );
}
