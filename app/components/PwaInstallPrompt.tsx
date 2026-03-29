import i18n from "@/constants/i18n";
import { useTheme } from "@/constants/useThemes";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Button, Platform, Text, TouchableOpacity, View } from "react-native";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;

    // iOS: show custom banner if not installed
    if (isIos && !isInStandaloneMode) {
      setShowBanner(true);
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("User choice:", outcome);
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => setShowBanner(false);

  if (!showBanner) return null;

  return (
    <View style={{ position: "fixed", bottom: 20, left: 20, right: 20, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: theme.primary, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 9999 }}>
      <View style={{ display: "flex", flexDirection: "row", alignItems: "center", marginRight: 12 }}>
        { /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ?
          <Ionicons name="share-outline" size={18} color={theme.text} style={{ marginRight: 6 }} /> :
          <Ionicons name="download" size={18} color={theme.text} style={{ marginRight: 6 }} />
        }
      </View>
      <Text style={{ color: theme.text, flex: 1, marginRight: 12 }}>
        { /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
          ? i18n.t("components.pwainstallprompt.ios")
          : i18n.t("components.pwainstallprompt.default") }
      </Text>
      {deferredPrompt && (
        <TouchableOpacity onPress={handleInstallClick} style={{ backgroundColor: theme.text, borderWidth: 0, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, cursor: "pointer", marginRight: 8 }}>
          <Text style={{ color: theme.primary }}>{i18n.t("components.pwainstallprompt.install")}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleDismiss} style={{ backgroundColor: "transparent", borderWidth: 0, cursor: "pointer" }}>
        <Ionicons name="close" size={18} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}