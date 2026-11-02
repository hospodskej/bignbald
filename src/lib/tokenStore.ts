import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Where the login token lives, kept apart from the rest of the app's data.
 * iOS / Android: SecureStore (Keychain / Keystore, encrypted by the OS).
 * Web: browser storage.
 *
 * TODO(security): on web, switch to an httpOnly cookie session (AdonisJS session guard)
 * once the web app and the API are hosted on the same site (e.g. bignbald.cz and
 * api.bignbald.cz). An httpOnly cookie can't be read by JavaScript, so a script injected
 * into the page couldn't steal it. Doing it before then needs cross-site cookies
 * (SameSite=None; Secure), CSRF protection and two login types on the server.
 */
const KEY = 'bignbald.token';
const web = Platform.OS === 'web';

export const tokenStore = {
  get: (): Promise<string | null> => (web ? AsyncStorage.getItem(KEY) : SecureStore.getItemAsync(KEY)).catch(() => null),
  set: (token: string) => (web ? AsyncStorage.setItem(KEY, token) : SecureStore.setItemAsync(KEY, token)).catch(() => {}),
  clear: () => (web ? AsyncStorage.removeItem(KEY) : SecureStore.deleteItemAsync(KEY)).catch(() => {}),
};
