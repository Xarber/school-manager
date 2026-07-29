import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

function getWebDeviceName() {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    const operatingSystem = /iPhone|iPad|iPod/i.test(userAgent)
        ? "iOS"
        : /Android/i.test(userAgent)
            ? "Android"
            : /Windows/i.test(userAgent)
                ? "Windows"
                : /Macintosh|Mac OS X/i.test(userAgent)
                    ? "macOS"
                    : /Linux/i.test(userAgent)
                        ? "Linux"
                        : "Unknown OS";
    const browser = /Edg\//i.test(userAgent)
        ? "Microsoft Edge"
        : /Firefox\//i.test(userAgent)
            ? "Firefox"
            : /CriOS\//i.test(userAgent)
                ? "Chrome"
                : /Chrome\//i.test(userAgent)
                    ? "Chrome"
                    : /Safari\//i.test(userAgent)
                        ? "Safari"
                        : "Web browser";

    return `${operatingSystem} on ${browser}`;
}

export function getSessionDeviceName() {
    if (Platform.OS === "web") return getWebDeviceName();

    return Device.modelName?.trim() || Device.deviceName?.trim() || `School Manager (${Platform.OS})`;
}

export function getAppVersion() {
    return Constants.expoConfig?.version || Constants.nativeAppVersion || "Unknown";
}

export function getSessionMetadataHeaders() {
    return {
        "X-Device-Name": getSessionDeviceName(),
        "X-App-Version": getAppVersion(),
    };
}
