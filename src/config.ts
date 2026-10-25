import Constants from "expo-constants";
import { Platform } from "react-native";


declare const process: { env: { EXPO_PUBLIC_API_URL?: string } };
const resolveApiUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }
  if (Platform.OS === "web") {
    return "http://localhost:3000/graphql";
  }
  const hostUri = Constants.expoConfig?.hostUri ?? "";
  const host = hostUri.split(":")[0];
  if (host) {
    return `http://${host}:3000/graphql`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:3000/graphql" : "http://localhost:3000/graphql";
};

export const API_URL = resolveApiUrl();
