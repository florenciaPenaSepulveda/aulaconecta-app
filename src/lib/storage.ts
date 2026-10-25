import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const usaAlmacenSeguro = (): boolean => Platform.OS !== "web";

export const storage = {
  getItem: (key: string): Promise<string | null> =>
    usaAlmacenSeguro() ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string): Promise<void> =>
    usaAlmacenSeguro() ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value),
  removeItem: (key: string): Promise<void> =>
    usaAlmacenSeguro() ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key),
};
