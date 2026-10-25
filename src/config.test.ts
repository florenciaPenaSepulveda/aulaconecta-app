import { Platform } from "react-native";

const load = (os: string, hostUri?: string) => {
  jest.resetModules();
  Platform.OS = os as typeof Platform.OS;
  jest.doMock("expo-constants", () => ({ __esModule: true, default: { expoConfig: hostUri ? { hostUri } : {} } }));
  return require("./config").API_URL as string;
};

describe("API_URL", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("usa localhost en la web", () => {
    expect(load("web")).toBe("http://localhost:3000/graphql");
  });

  it("deduce la IP del computador desde Expo Go", () => {
    expect(load("android", "192.168.1.5:8081")).toBe("http://192.168.1.5:3000/graphql");
  });

  it("usa valores por defecto en emuladores", () => {
    expect(load("android")).toBe("http://10.0.2.2:3000/graphql");
    expect(load("ios")).toBe("http://localhost:3000/graphql");
  });
});
