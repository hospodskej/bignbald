import { Alert, Platform } from 'react-native';

/** Yes/no prompt that works on web too (Alert buttons don't on web). */
export function confirm(title: string, message: string, onYes: () => void, yes = 'OK') {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: yes, onPress: onYes }]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
