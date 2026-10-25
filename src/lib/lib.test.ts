import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Alert } from "react-native";
import { average, formatDate, formatGrade, formatTime, gradeTone, initials } from "./format";
import { passwordError } from "./password";
import { formatRut, isValidRut } from "./rut";
import { getCurrentToken, loadSession, normalizeRole, notifySessionExpired, onSessionExpired, saveSession, setCurrentToken } from "./session";

const alerts = jest.requireActual("./alerts") as typeof import("./alerts");

describe("rut", () => {
  it("formatea y valida", async () => {
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(formatRut("1")).toBe("1");
    expect(isValidRut("12.345.678-5")).toBe(true);
    expect(isValidRut("12.345.678-9")).toBe(false);
    expect(isValidRut("123")).toBe(false);
    expect(isValidRut("23.232.323-K")).toBe(true);
  });
});

describe("format", () => {
  it("formatea fechas, notas y promedios", async () => {
    expect(formatDate("2026-10-24T15:30:00")).toMatch(/2026/);
    expect(formatTime("2026-10-24T15:30:00")).toBeTruthy();
    expect(formatGrade(5.64)).toBe("5.6");
    expect(formatGrade(0)).toBe("-");
    expect(average([4, 6])).toBe(5);
    expect(average([])).toBe(0);
    expect(gradeTone(0)).toBe("badge-ghost");
    expect(initials("ana", "perez")).toBe("AP");
  });
});

describe("passwordError", () => {
  it("acepta contraseñas con letras y números", async () => {
    expect(passwordError("Clave12345")).toBe("");
  });

  it("rechaza las muy cortas, las sin números o letras y las demasiado largas", async () => {
    expect(passwordError("Ab1")).toMatch(/al menos 8/);
    expect(passwordError("soloLetrasAqui")).toMatch(/letras y números/);
    expect(passwordError("123456789")).toMatch(/letras y números/);
    expect(passwordError("a1".repeat(40))).toMatch(/72/);
  });
});

describe("session", () => {
  const session = { token: "t", id: 3, role: "teacher" as const, firstName: "Ana", isChangePassword: false };

  beforeEach(() => {
    (SecureStore as unknown as { __vaciar: () => void }).__vaciar();
    return AsyncStorage.clear();
  });

  it("guarda, carga y elimina la sesión", async () => {
    expect(await loadSession()).toBeNull();
    await saveSession(session);
    expect(await loadSession()).toEqual(session);
    await saveSession(null);
    expect(await loadSession()).toBeNull();
  });

  it("administra el token en memoria y normaliza el rol", async () => {
    setCurrentToken("abc");
    expect(getCurrentToken()).toBe("abc");
    setCurrentToken(null);
    expect(getCurrentToken()).toBeNull();
    expect(normalizeRole("Parents")).toBe("parents");
  });

  it("tolera fallos de almacenamiento", async () => {
    jest.spyOn(SecureStore, "getItemAsync").mockRejectedValueOnce(new Error("fallo"));
    expect(await loadSession()).toBeNull();
    jest.spyOn(SecureStore, "setItemAsync").mockRejectedValueOnce(new Error("fallo"));
    await expect(saveSession(session)).resolves.toBeUndefined();
  });

  it("guarda la sesión en el almacén seguro del dispositivo y no en el almacenamiento común", async () => {
    await saveSession(session);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("aulaconecta.session", JSON.stringify(session));
    expect(await AsyncStorage.getItem("aulaconecta.session")).toBeNull();
  });

  it("en la web usa el almacenamiento del navegador", async () => {
    const restaurar = jest.replaceProperty(Platform, "OS", "web");
    await saveSession(session);
    expect(await AsyncStorage.getItem("aulaconecta.session")).toBe(JSON.stringify(session));
    expect(await loadSession()).toEqual(session);
    await saveSession(null);
    expect(await AsyncStorage.getItem("aulaconecta.session")).toBeNull();
    restaurar.restore();
  });

  it("avisa a los oyentes cuando la sesión expira y permite darse de baja", async () => {
    const oyente = jest.fn();
    const baja = onSessionExpired(oyente);
    notifySessionExpired();
    baja();
    notifySessionExpired();
    expect(oyente).toHaveBeenCalledTimes(1);
  });
});

describe("alerts", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it("usa Alert en dispositivos", async () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    alerts.notify("Título", "Mensaje");
    expect(spy).toHaveBeenCalledWith("Título", "Mensaje");
  });

  it("usa window.alert y window.confirm en la web", async () => {
    Platform.OS = "web";
    const alertSpy = jest.fn();
    const confirmSpy = jest.fn(() => true);
    Object.assign(globalThis, { window: { alert: alertSpy, confirm: confirmSpy } });
    alerts.notify("Título");
    alerts.notify("Título", "Mensaje");
    expect(alertSpy).toHaveBeenNthCalledWith(1, "Título");
    expect(alertSpy).toHaveBeenNthCalledWith(2, "Título\n\nMensaje");
    await expect(alerts.confirmAction("Título", "Mensaje")).resolves.toBe(true);
  });

  it("resuelve la confirmación en dispositivos", async () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
      buttons?.[1].onPress?.();
    });
    await expect(alerts.confirmAction("Título", "Mensaje", "Eliminar")).resolves.toBe(true);
    spy.mockImplementation((_t, _m, buttons) => {
      buttons?.[0].onPress?.();
    });
    await expect(alerts.confirmAction("Título", "Mensaje")).resolves.toBe(false);
    spy.mockImplementation((_t, _m, _b, options) => {
      options?.onDismiss?.();
    });
    await expect(alerts.confirmAction("Título", "Mensaje")).resolves.toBe(false);
  });

  it("extrae mensajes de error amigables", async () => {
    expect(alerts.errorMessage({ graphQLErrors: [{ message: "Detalle" }] })).toBe("Detalle");
    expect(alerts.errorMessage(new Error("Directo"))).toBe("Directo");
    expect(alerts.errorMessage(new Error("Bad Request Exception"), "Genérico")).toBe("Genérico");
    expect(alerts.errorMessage(new Error("Network request failed"))).toMatch(/No se pudo conectar/);
    expect(alerts.errorMessage(undefined)).toBe("Ocurrió un error inesperado");
    expect(alerts.errorMessage(new Error("ThrottlerException: Too Many Requests"))).toMatch(/Demasiados intentos/);
  });
});
