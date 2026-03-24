import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice || Platform.OS === "web") {
        console.warn('Push notifications are not supported on simulators. Skipped registering for push notifications.');
        return null;
    }

    const Notifications = await import("expo-notifications");
  
    // Get existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
  
    // Ask if not yet granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
  
    if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
    }
  
    // For EAS builds, you generally use the projectId
    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
  
    // Get Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
    });
    const expoPushToken = tokenResponse.data;
    console.warn('Expo push token:', expoPushToken);
  
    return expoPushToken;
}

export function turnOnNotifications({accountData, userData}: any) {
    return new Promise(async (resolve, reject) => {
        const token = await registerForPushNotificationsAsync().catch(e=>{
            console.warn("[PushNotifications] Failed:", e);
            return reject(e);
        });
        if (!token) return reject("No token was returned");

        console.warn("[PushNotifications] Registered:", token);
        if (token) accountData.save({...accountData.data, pushToken: token}).then(()=>{
            userData.save({...userData.data, pushtokens: [...(userData.data.pushtokens ?? []), token]}).then(()=>{
                resolve(true);
            });
        });
    });
}

export function turnOffNotifications({accountData, userData}: any) {
    return new Promise(async (resolve, reject) => {
        await userData.save({...userData.data, pushtokens: (userData.data.pushtokens ?? []).filter((token: string) => token !== accountData.data.pushToken)}).catch(reject);
        await accountData.save({...accountData.data, pushToken: null}).catch(reject);
        console.log("[PushNotifications] Unregistered");
        resolve(true);
    });
}