import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ChatScreen, ContactsScreen, NoticesScreen, ProfileScreen } from "./common";
import {
  CHAT_CONTACTS,
  CONVERSATION,
  CREATE_NOTICE,
  DELETE_NOTICE,
  GET_ALL_NOTICES,
  SEND_MESSAGE,
} from "../graphql";
import { confirmAction, notify } from "../lib/alerts";
import { fail, makeNavigation, makeSession, ok, renderScreen } from "../test/utils";

const notice = {
  id: 1,
  title: "Reunión de apoderados",
  description: "Viernes a las 18:30",
  imageUrl: null,
  createdAt: "2026-10-20T12:00:00.000Z",
};

describe("NoticesScreen", () => {
  const list = ok(GET_ALL_NOTICES, undefined, { getAllNotices: [notice] });

  it("el apoderado solo lee los anuncios", async () => {
    await renderScreen(<NoticesScreen />, { session: makeSession("parents"), mocks: [list] });
    expect(await screen.findByText("Reunión de apoderados")).toBeTruthy();
    expect(screen.queryByText("Nuevo anuncio")).toBeNull();
    expect(screen.queryByText("Eliminar")).toBeNull();
  });

  it("el profesor publica un anuncio", async () => {
    await renderScreen(<NoticesScreen />, {
      session: makeSession("teacher"),
      mocks: [list, ok(CREATE_NOTICE, { title: "Paseo", description: "Salida a terreno", imageUrl: "https://a.cl/p.png" }, { createNotice: { isCreateNotice: true } })],
    });
    await screen.findByText("Reunión de apoderados");
    await fireEvent.press(await screen.findByText("Nuevo anuncio"));
    await fireEvent.changeText(screen.getByLabelText("Título"), "Paseo");
    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "Salida a terreno");
    await fireEvent.changeText(screen.getByLabelText("URL de imagen (opcional)"), "https://a.cl/p.png");
    await fireEvent.press(screen.getByText("Publicar"));
    await waitFor(() => expect(screen.queryByText("Publicar")).toBeNull());
  });

  it("valida los campos y reporta errores al publicar", async () => {
    await renderScreen(<NoticesScreen />, {
      session: makeSession("admin"),
      mocks: [list, ok(CREATE_NOTICE, { title: "Paseo", description: "Salida", imageUrl: null }, { createNotice: { isCreateNotice: false } })],
    });
    await screen.findByText("Reunión de apoderados");
    await fireEvent.press(await screen.findByText("Nuevo anuncio"));
    await fireEvent.press(screen.getByText("Publicar"));
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", "Completa el título y el mensaje.");
    await fireEvent.changeText(screen.getByLabelText("Título"), "Paseo");
    await fireEvent.changeText(screen.getByLabelText("Mensaje"), "Salida");
    await fireEvent.press(screen.getByText("Publicar"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo publicar", expect.any(String)));
    await fireEvent.press(screen.getByText("Cancelar"));
    expect(screen.queryByText("Publicar")).toBeNull();
  });

  it("elimina un anuncio tras confirmar", async () => {
    await renderScreen(<NoticesScreen />, {
      session: makeSession("teacher"),
      mocks: [list, ok(DELETE_NOTICE, { id: 1 }, { deleteNotice: true })],
    });
    await fireEvent.press(await screen.findByText("Eliminar"));
    await waitFor(() => expect(confirmAction).toHaveBeenCalled());
  });

  it("no elimina si se cancela y reporta errores", async () => {
    await renderScreen(<NoticesScreen />, { session: makeSession("teacher"), mocks: [list, fail(DELETE_NOTICE, { id: 1 })] });
    (confirmAction as jest.Mock).mockResolvedValueOnce(false);
    await fireEvent.press(await screen.findByText("Eliminar"));
    await waitFor(() => expect(confirmAction).toHaveBeenCalledTimes(1));
    expect(notify).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Eliminar"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo eliminar", expect.any(String)));
  });

  it("muestra estados vacío y de error", async () => {
    const empty = await renderScreen(<NoticesScreen />, {
      session: makeSession("parents"),
      mocks: [ok(GET_ALL_NOTICES, undefined, { getAllNotices: [] })],
    });
    expect(await screen.findByText("No hay anuncios publicados")).toBeTruthy();
    await empty.unmount();
    await renderScreen(<NoticesScreen />, { session: makeSession("parents"), mocks: [fail(GET_ALL_NOTICES, undefined)] });
    expect(await screen.findByText("No se pudieron cargar los anuncios.")).toBeTruthy();
  });
});

describe("ContactsScreen", () => {
  const contact = { id: "4", firstName: "Paula", lastName: "Apoderada", role: "Parents" };

  it("lista contactos y abre el chat", async () => {
    const navigation = makeNavigation();
    await renderScreen(<ContactsScreen navigation={navigation} />, {
      session: makeSession("teacher"),
      mocks: [ok(CHAT_CONTACTS, undefined, { chatContacts: [contact] })],
    });
    expect(await screen.findByText("Paula Apoderada")).toBeTruthy();
    await fireEvent.press(screen.getByText("Abrir chat"));
    expect(navigation.navigate).toHaveBeenCalledWith("Chat", { contact });
  });

  it("explica cuando no hay contactos y cuando falla la carga", async () => {
    const empty = await renderScreen(<ContactsScreen navigation={makeNavigation()} />, {
      session: makeSession("parents"),
      mocks: [ok(CHAT_CONTACTS, undefined, { chatContacts: [] })],
    });
    expect(await screen.findByText("Aún no tienes contactos")).toBeTruthy();
    expect(screen.getByText("Conversa con los profesores de tus pupilos")).toBeTruthy();
    await empty.unmount();
    await renderScreen(<ContactsScreen navigation={makeNavigation()} />, { session: makeSession("teacher"), mocks: [fail(CHAT_CONTACTS, undefined)] });
    expect(await screen.findByText("No se pudieron cargar tus contactos.")).toBeTruthy();
  });
});

describe("ChatScreen", () => {
  const contact = { id: "4", firstName: "Paula", lastName: "Apoderada", role: "Parents" };
  const messages = [
    { id: "1", fromId: 1, toId: 4, content: "Buenos días", createdAt: "2026-10-20T12:00:00.000Z" },
    { id: "2", fromId: 4, toId: 1, content: "Muchas gracias", createdAt: "2026-10-21T12:00:00.000Z" },
  ];
  const route = { params: { contact } };

  it("muestra la conversación", async () => {
    await renderScreen(<ChatScreen route={route} />, {
      session: makeSession("teacher"),
      mocks: [ok(CONVERSATION, { withId: 4 }, { conversation: messages })],
    });
    expect(await screen.findByText("Buenos días")).toBeTruthy();
    expect(screen.getByText("Muchas gracias")).toBeTruthy();
  });

  it("envía un mensaje y limpia el campo", async () => {
    await renderScreen(<ChatScreen route={route} />, {
      session: makeSession("teacher"),
      mocks: [ok(CONVERSATION, { withId: 4 }, { conversation: [] }), ok(SEND_MESSAGE, { toId: 4, content: "Hola" }, { sendMessage: { id: "3" } })],
    });
    expect(await screen.findByText("Aún no hay mensajes")).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText("Escribe un mensaje"), "Hola");
    await fireEvent.press(screen.getByText("Enviar"));
    await waitFor(() => expect(screen.getByPlaceholderText("Escribe un mensaje").props.value).toBe(""));
  });

  it("ignora mensajes vacíos y reporta errores de envío", async () => {
    await renderScreen(<ChatScreen route={route} />, {
      session: makeSession("teacher"),
      mocks: [ok(CONVERSATION, { withId: 4 }, { conversation: [] }), fail(SEND_MESSAGE, { toId: 4, content: "Hola" })],
    });
    await screen.findByText("Aún no hay mensajes");
    await fireEvent(screen.getByPlaceholderText("Escribe un mensaje"), "submitEditing");
    expect(notify).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByPlaceholderText("Escribe un mensaje"), "Hola");
    await fireEvent(screen.getByPlaceholderText("Escribe un mensaje"), "submitEditing");
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo enviar", expect.any(String)));
  });
});

describe("ProfileScreen", () => {
  it("muestra el perfil y permite cambiar la contraseña o cerrar sesión", async () => {
    const navigation = makeNavigation();
    await renderScreen(<ProfileScreen navigation={navigation} />, { session: makeSession("parents", { firstName: "Paula" }) });
    expect(await screen.findByText("Apoderado")).toBeTruthy();
    await fireEvent.press(screen.getByText("Cambiar contraseña"));
    expect(navigation.navigate).toHaveBeenCalledWith("ChangePassword");
    await fireEvent.press(screen.getByText("Cerrar sesión"));
    await waitFor(async () => expect(await AsyncStorage.getItem("aulaconecta.session")).toBeNull());
  });

  it("no muestra nada sin sesión", async () => {
    await renderScreen(<ProfileScreen navigation={makeNavigation()} />);
    expect(screen.queryByText("Perfil")).toBeNull();
  });
});
