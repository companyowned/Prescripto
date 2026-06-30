import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { authService } from '../services/auth';
// push notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
        if (token) {
            setExpoPushToken(token);
            // Send to backend
            authService.updatePushToken(token).catch(e => console.error(e));
        }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      // Medication alarm notifications are handled by useAlarmNotifications (AlarmOverlay).
      // Only show the generic alert for non-medication push notifications.
      const data = notification.request.content.data as any;
      if (data?.reminderId) return; // handled by AlarmOverlay

      const title = notification.request.content.title || 'Notification';
      const body  = notification.request.content.body  || 'You have a new alert!';
      if (Platform.OS === 'web') {
          window.alert(`${title}\n\n${body}`);
      } else {
          Alert.alert(title, body, [{ text: 'OK' }]);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (__DEV__) console.log('User reacted to notification:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return undefined;
  }

  let token;

  // Configuring Android Notification Channel to mimic an "Alarm"
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId ?? 
      "f9081609-7f60-4871-b7a4-e54b68ba4eb9";
      
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      if (__DEV__) console.warn('Error getting push token:', e);
      token = undefined;
    }
  }

  return token;
}
