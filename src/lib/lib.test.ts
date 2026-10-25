import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import { average, formatDate, formatGrade, formatTime, gradeTone, initials } from "./format";
import { formatRut, isValidRut } from "./rut";
import { getCurrentToken, loadSession, normalizeRole, saveSession, setCurrentToken } from "./session";

const alerts = jest.requireActual("./alerts") as typeof import("./alerts");

describe("rut", () => {
  it("formatea y valida", () => {
    expect(formatRut("123456785")).toBe("12.345.678-5");
    expect(formatRut("1")).toBe("1");
    expect(isValidRut("12.345.678-5")).toBe(true);
    expect(isValidRut("12.345.678-9")).toBe(false);
    expect(isValidRut("123")).toBe(false);
    expect(isValidRut("23.232.323-K")).toBe(true);
  });
});

describe("format", () => {
  it("formatea fechas, notas y promedios", () => {
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

describe("session", () => {
  const session = { token: "t", id: 3, role: "teacher" as const, firstName: "Ana", isChangePassword: false };

  beforeEach(() => AsyncStorage.clear());

  it("guarda, carga y elimina la sesión", async () => {
    expect(await loadSession()).toBeNull();
    await saveSession(session);
    expect(await loadSession()).toEqual(session);
    await saveSession(null);
    expect(await loadSession()).toBeNull();
  });

  it("administra el token en memoria y normaliza el rol", () => {
    setCurrentToken("abc");
    expect(getCurrentToken()).toBe("abc");
    setCurrentToken(null);
    expect(getCurrentToken()).toBeNull();
    expect(normalizeRole("Parents")).toBe("parents");
  });

  it("tolera fallos de almacenamiento", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("fallo"));
    expect(await loadSession()).toBeNull();
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("fallo"));
    await expect(saveSession(session)).resolves.toBeUndefined();
  });
});

describe("alerts", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it("usa Alert en dispositivos", () => {
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

  it("extrae mensajes de error amigables", () => {
    expect(alerts.errorMessage({ graphQLErrors: [{ message: "Detalle" }] })).toBe("Detalle");
    expect(alerts.errorMessage(new Error("Directo"))).toBe("Directo");
    expect(alerts.errorMessage(new Error("Bad Request Exception"), "Genérico")).toBe("Genérico");
    expect(alerts.errorMessage(new Error("Network request failed"))).toMatch(/No se pudo conectar/);
    expect(alerts.errorMessage(undefined)).toBe("Ocurrió un error inesperado");
  });
});
