import React from "react";
import * as SecureStore from "expo-secure-store";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import App from "./App";
import { makeSession } from "./src/test/utils";

const data: Record<string, unknown> = {
  MyChildren: { myChildren: [{ id: "5", firstName: "Juan", lastName: "Pérez", rut: "44.444.444-4", email: "j@test.cl", role: "Student" }] },
  GradesByStudent: { gradesByStudentId: [{ id: "1", grade: 6, studentId: 5, subjectId: 10 }] },
  AttendanceByStudent: { attendanceByStudent: [] },
  GetAllNotices: { getAllNotices: [] },
  SubjectsByTeacher: {
    getAllSubjectByIdTeacher: [
      { id: "10", name: "Matemática", numberOfClasses: 40, idTeacher: 1, course: { id: "1", nameCourse: "1° Básico A", level: "Basica" } },
    ],
  },
  ListCourses: { listCourses: [] },
  ChatContacts: { chatContacts: [] },
};

const mockFetch = () =>
  jest.spyOn(globalThis, "fetch").mockImplementation((async (_url: unknown, init?: { body?: string }) => {
    const { operationName } = JSON.parse(init?.body ?? "{}");
    const body = JSON.stringify({ data: data[operationName] ?? null });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  }) as unknown as typeof fetch);

const startWith = async (session: ReturnType<typeof makeSession> | null) => {
  (SecureStore as unknown as { __vaciar: () => void }).__vaciar();
  if (session) {
    await SecureStore.setItemAsync("aulaconecta.session", JSON.stringify(session));
  }
  mockFetch();
  return render(<App />);
};

describe("App", () => {
  it("muestra el ingreso cuando no hay sesión", async () => {
    await startWith(null);
    expect((await screen.findAllByText("Iniciar sesión")).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText("Regístrate"));
    expect((await screen.findAllByText("Crear cuenta")).length).toBeGreaterThan(0);
  });

  it("exige cambiar la contraseña antes de continuar", async () => {
    await startWith(makeSession("teacher", { isChangePassword: true }));
    expect(await screen.findByText(/debes definir una nueva contraseña/)).toBeTruthy();
  });

  it("muestra el inicio del apoderado y navega entre pestañas", async () => {
    await startWith(makeSession("parents", { firstName: "Paula", id: 4 }));
    expect(await screen.findByText("Hola, Paula")).toBeTruthy();
    expect(await screen.findByText("Juan Pérez")).toBeTruthy();
    fireEvent.press(screen.getByText("Anuncios"));
    expect(await screen.findByText("Comunicados del colegio")).toBeTruthy();
    fireEvent.press(screen.getByText("Mensajes"));
    expect(await screen.findByText("Conversa con los profesores de tus pupilos")).toBeTruthy();
    fireEvent.press(screen.getByText("Perfil"));
    expect(await screen.findByText("Tu cuenta en AulaConecta")).toBeTruthy();
    fireEvent.press(screen.getByText("Cambiar contraseña"));
    expect((await screen.findAllByText("Cambiar contraseña")).length).toBeGreaterThan(0);
  });

  it("muestra las asignaturas del profesor y abre la asistencia por curso", async () => {
    await startWith(makeSession("teacher"));
    expect(await screen.findByText("Matemática")).toBeTruthy();
    fireEvent.press(screen.getByText("Asistencia por curso"));
    await waitFor(() => expect(screen.getAllByText("Asistencia por curso").length).toBeGreaterThan(0));
  });
});
