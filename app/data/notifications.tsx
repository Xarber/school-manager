import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return null;
    }
  
    // Get existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
  
    // Ask if not yet granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
  
    if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
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
    console.log('Expo push token:', expoPushToken);
  
    return expoPushToken;
}
