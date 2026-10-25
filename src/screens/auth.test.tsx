import React from "react";
import * as SecureStore from "expo-secure-store";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ChangePasswordScreen, ForgotPassScreen, LoginScreen, RegisterScreen } from "./auth";
import { CHANGE_PASSWORD, FORGOT_PASS, LOGIN, REGISTER } from "../graphql";
import { notify } from "../lib/alerts";
import { notifySessionExpired } from "../lib/session";
import { fail, makeNavigation, makeSession, ok, renderScreen } from "../test/utils";

const press = (text: string) => fireEvent.press(screen.getAllByText(text).slice(-1)[0]);

describe("LoginScreen", () => {
  const credentials = { email: "profe@test.cl", password: "Demo1234" };
  const fillAndSubmit = () => {
    fireEvent.changeText(screen.getByLabelText("Correo electrónico"), " profe@test.cl ");
    fireEvent.changeText(screen.getByLabelText("Contraseña"), "Demo1234");
    press("Iniciar sesión");
  };

  it("inicia sesión y guarda la sesión", async () => {
    await renderScreen(<LoginScreen navigation={makeNavigation()} />, {
      mocks: [ok(LOGIN, credentials, { login: { token: "jwt", id: 7, role: "Teacher", firstName: "Carlos", isChangePassword: false } })],
    });
    fillAndSubmit();
    await waitFor(async () => expect(JSON.parse((await SecureStore.getItemAsync("aulaconecta.session")) ?? "null")).toMatchObject({ token: "jwt", role: "teacher", id: 7 }));
  });

  it("valida que haya correo y contraseña", async () => {
    await renderScreen(<LoginScreen navigation={makeNavigation()} />);
    press("Iniciar sesión");
    expect(notify).toHaveBeenCalledWith("Revisa los datos", "Ingresa tu correo y tu contraseña.");
  });

  it("informa credenciales incorrectas o respuestas inválidas", async () => {
    await renderScreen(<LoginScreen navigation={makeNavigation()} />, { mocks: [fail(LOGIN, credentials, "Contraseña o email no válido")] });
    fillAndSubmit();
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo iniciar sesión", "Contraseña o email no válido"));
  });

  it("informa cuando la respuesta no trae token", async () => {
    await renderScreen(<LoginScreen navigation={makeNavigation()} />, { mocks: [ok(LOGIN, credentials, { login: { token: null } })] });
    fillAndSubmit();
    await waitFor(() => expect(notify).toHaveBeenCalled());
  });

  it("navega a recuperar contraseña y registro", async () => {
    const navigation = makeNavigation();
    await renderScreen(<LoginScreen navigation={navigation} />);
    fireEvent.press(screen.getByText("¿Olvidaste tu contraseña?"));
    expect(navigation.navigate).toHaveBeenCalledWith("ForgotPass");
    fireEvent.press(screen.getByText("Regístrate"));
    expect(navigation.navigate).toHaveBeenCalledWith("Register");
  });
});

describe("RegisterScreen", () => {
  const variables = (role = "teacher") => ({
    firstName: "Ana",
    lastName: "Pérez",
    rut: "12.345.678-5",
    email: "ana@test.cl",
    password: "Clave12345",
    role,
  });

  const fill = (rut = "123456785", password = "Clave12345", confirm = "Clave12345", first = "Ana") => {
    fireEvent.changeText(screen.getByLabelText("Nombre"), first);
    fireEvent.changeText(screen.getByLabelText("Apellido"), "Pérez");
    fireEvent.changeText(screen.getByLabelText("RUT"), rut);
    fireEvent.changeText(screen.getByLabelText("Correo electrónico"), "ana@test.cl");
    fireEvent.changeText(screen.getByLabelText("Contraseña"), password);
    fireEvent.changeText(screen.getByLabelText("Repetir contraseña"), confirm);
  };

  it("crea la cuenta de un profesor y vuelve al ingreso", async () => {
    const navigation = makeNavigation();
    await renderScreen(<RegisterScreen navigation={navigation} />, { mocks: [ok(REGISTER, variables(), { register: { message: "ok" } })] });
    fill();
    press("Crear cuenta");
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith("Login"));
    expect(notify).toHaveBeenCalledWith("Cuenta creada", "Ya puedes iniciar sesión.");
  });

  it("permite elegir el tipo apoderado", async () => {
    const navigation = makeNavigation();
    await renderScreen(<RegisterScreen navigation={navigation} />, { mocks: [ok(REGISTER, variables("parents"), { register: { message: "ok" } })] });
    fireEvent.press(screen.getByText("Apoderado"));
    fill();
    press("Crear cuenta");
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith("Login"));
  });

  it("valida campos, RUT y contraseñas", async () => {
    await renderScreen(<RegisterScreen navigation={makeNavigation()} />);
    press("Crear cuenta");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "Completa todos los campos.");
    fill("123456789");
    press("Crear cuenta");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "El RUT ingresado no es válido.");
    fill("123456785", "corta", "corta");
    press("Crear cuenta");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "La contraseña debe tener al menos 8 caracteres.");
    fill("123456785", "soloLetrasAqui", "soloLetrasAqui");
    press("Crear cuenta");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "La contraseña debe incluir letras y números.");
    fill("123456785", "Clave12345", "Distinta123");
    press("Crear cuenta");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "Las contraseñas no coinciden.");
  });

  it("muestra el error del servidor y permite volver al ingreso", async () => {
    const navigation = makeNavigation();
    await renderScreen(<RegisterScreen navigation={navigation} />, { mocks: [fail(REGISTER, variables(), "El email ya se encuentra registrado")] });
    fill();
    press("Crear cuenta");
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo crear la cuenta", "El email ya se encuentra registrado"));
    fireEvent.press(screen.getByText("Inicia sesión"));
    expect(navigation.navigate).toHaveBeenCalledWith("Login");
  });
});

describe("ForgotPassScreen", () => {
  it("solicita la contraseña temporal", async () => {
    const navigation = makeNavigation();
    await renderScreen(<ForgotPassScreen navigation={navigation} />, {
      mocks: [ok(FORGOT_PASS, { email: "ana@test.cl" }, { forgotPass: { message: "ok" } })],
    });
    press("Enviar contraseña temporal");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "Ingresa tu correo electrónico.");
    fireEvent.changeText(screen.getByLabelText("Correo electrónico"), "ana@test.cl");
    press("Enviar contraseña temporal");
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith("Login"));
  });

  it("informa cuando falla y permite volver", async () => {
    const navigation = makeNavigation();
    await renderScreen(<ForgotPassScreen navigation={navigation} />, {
      mocks: [fail(FORGOT_PASS, { email: "ana@test.cl" }, "El envío de correos no está configurado")],
    });
    fireEvent.changeText(screen.getByLabelText("Correo electrónico"), "ana@test.cl");
    press("Enviar contraseña temporal");
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo enviar el correo", "El envío de correos no está configurado"));
    fireEvent.press(screen.getByText("Volver a iniciar sesión"));
    expect(navigation.navigate).toHaveBeenCalledWith("Login");
  });
});

describe("ChangePasswordScreen", () => {
  const render = (session = makeSession("teacher", { isChangePassword: true }), mocks = [ok(CHANGE_PASSWORD, { newPassword: "Clave12345" }, { changePassword: { message: "ok" } })]) =>
    renderScreen(<ChangePasswordScreen />, { session, mocks, withNavigation: true });

  it("actualiza la contraseña y marca la sesión como actualizada", async () => {
    await render();
    await screen.findByText(/debes definir una nueva contraseña/);
    fireEvent.changeText(screen.getByLabelText("Nueva contraseña"), "Clave12345");
    fireEvent.changeText(screen.getByLabelText("Confirmar contraseña"), "Clave12345");
    press("Guardar contraseña");
    await waitFor(async () => expect(JSON.parse((await SecureStore.getItemAsync("aulaconecta.session")) ?? "{}").isChangePassword).toBe(false));
    expect(notify).toHaveBeenCalledWith("Contraseña actualizada");
  });

  it("valida el largo y la coincidencia", async () => {
    await render(makeSession("teacher"));
    await screen.findByText(/Define una nueva contraseña/);
    fireEvent.changeText(screen.getByLabelText("Nueva contraseña"), "corta");
    press("Guardar contraseña");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "La contraseña debe tener al menos 8 caracteres.");
    fireEvent.changeText(screen.getByLabelText("Nueva contraseña"), "Clave12345");
    fireEvent.changeText(screen.getByLabelText("Confirmar contraseña"), "Distinta123");
    press("Guardar contraseña");
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "Las contraseñas no coinciden.");
  });

  it("cierra la sesión y avisa cuando el servidor informa que expiró", async () => {
    await render(makeSession("teacher"));
    await screen.findByText(/Define una nueva contraseña/);
    act(() => notifySessionExpired());
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Tu sesión expiró", "Inicia sesión nuevamente para continuar."));
    await waitFor(async () => expect(await SecureStore.getItemAsync("aulaconecta.session")).toBeNull());
  });

  it("informa errores y permite cerrar sesión", async () => {
    await render(makeSession("teacher"), [fail(CHANGE_PASSWORD, { newPassword: "Clave12345" }, "Falla")]);
    await screen.findByText(/Define una nueva contraseña/);
    fireEvent.changeText(screen.getByLabelText("Nueva contraseña"), "Clave12345");
    fireEvent.changeText(screen.getByLabelText("Confirmar contraseña"), "Clave12345");
    press("Guardar contraseña");
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo cambiar la contraseña", "Falla"));
    fireEvent.press(screen.getByText("Cerrar sesión"));
    await waitFor(async () => expect(await SecureStore.getItemAsync("aulaconecta.session")).toBeNull());
  });
});
