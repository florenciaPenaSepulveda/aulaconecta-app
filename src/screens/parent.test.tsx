import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { ChildDetailScreen, ParentHomeScreen } from "./parent";
import { ATTENDANCE_BY_STUDENT, GET_ALL_NOTICES, GRADES_BY_STUDENT, MY_CHILDREN } from "../graphql";
import { fail, makeNavigation, makeSession, ok, renderScreen } from "../test/utils";

const child = {
  id: "5",
  firstName: "Juan",
  lastName: "Pérez",
  rut: "44.444.444-4",
  email: "juan@test.cl",
  role: "Student",
};

const notice = { id: 1, title: "Reunión", description: "Viernes a las 18:30", imageUrl: null, createdAt: "2026-10-20T12:00:00.000Z" };

const grades = {
  gradesByStudentId: [
    { id: "1", grade: 6.5, studentId: 5, subjectId: 10 },
    { id: "2", grade: 3.5, studentId: 5, subjectId: 11 },
  ],
};

const attendance = {
  attendanceByStudent: [
    { totalAsist: 9, totalAbsences: 1, subject: { id: "10", name: "Matemática", numberOfClasses: 40, course: { nameCourse: "1° Básico A" } } },
    { totalAsist: 12, totalAbsences: 8, subject: { id: "11", name: "Inglés", numberOfClasses: 40, course: { nameCourse: "1° Básico A" } } },
    { totalAsist: 0, totalAbsences: 0, subject: { id: "12", name: "Música", numberOfClasses: 40, course: { nameCourse: "1° Básico A" } } },
  ],
};

describe("ParentHomeScreen", () => {
  const baseMocks = [
    ok(MY_CHILDREN, undefined, { myChildren: [child] }),
    ok(GRADES_BY_STUDENT, { studentId: 5 }, grades),
    ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, attendance),
    ok(GET_ALL_NOTICES, undefined, { getAllNotices: [notice] }),
  ];

  it("resume a cada pupilo y abre su detalle", async () => {
    const navigation = makeNavigation();
    await renderScreen(<ParentHomeScreen navigation={navigation} />, { session: makeSession("parents", { firstName: "Paula" }), mocks: baseMocks });
    expect(await screen.findByText("Hola, Paula")).toBeTruthy();
    expect(await screen.findByText("Juan Pérez")).toBeTruthy();
    expect(await screen.findByText("5.0")).toBeTruthy();
    expect(await screen.findByText("70%")).toBeTruthy();
    expect(await screen.findByText("Reunión")).toBeTruthy();
    await fireEvent.press(screen.getByText("Ver detalle académico"));
    expect(navigation.navigate).toHaveBeenCalledWith("ChildDetail", { child: expect.objectContaining({ id: "5" }) });
  });

  it("explica cuando no hay pupilos ni anuncios", async () => {
    await renderScreen(<ParentHomeScreen navigation={makeNavigation()} />, {
      session: makeSession("parents"),
      mocks: [ok(MY_CHILDREN, undefined, { myChildren: [] }), ok(GET_ALL_NOTICES, undefined, { getAllNotices: [] })],
    });
    expect(await screen.findByText("No tienes pupilos asociados")).toBeTruthy();
    expect(await screen.findByText("No hay anuncios publicados.")).toBeTruthy();
  });

  it("muestra guiones sin notas ni asistencia", async () => {
    await renderScreen(<ParentHomeScreen navigation={makeNavigation()} />, {
      session: makeSession("parents"),
      mocks: [
        ok(MY_CHILDREN, undefined, { myChildren: [child] }),
        ok(GRADES_BY_STUDENT, { studentId: 5 }, { gradesByStudentId: [] }),
        ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, { attendanceByStudent: [] }),
        ok(GET_ALL_NOTICES, undefined, { getAllNotices: [] }),
      ],
    });
    await screen.findByText("Juan Pérez");
    expect((await screen.findAllByText("-")).length).toBe(2);
  });

  it("informa cuando falla la carga", async () => {
    await renderScreen(<ParentHomeScreen navigation={makeNavigation()} />, {
      session: makeSession("parents"),
      mocks: [fail(MY_CHILDREN, undefined), ok(GET_ALL_NOTICES, undefined, { getAllNotices: [] })],
    });
    expect(await screen.findByText("No se pudo cargar la información de tus pupilos.")).toBeTruthy();
  });
});

describe("ChildDetailScreen", () => {
  const route = { params: { child } };

  it("muestra promedio, notas y asistencia por asignatura", async () => {
    await renderScreen(<ChildDetailScreen route={route} />, {
      session: makeSession("parents"),
      mocks: [ok(GRADES_BY_STUDENT, { studentId: 5 }, grades), ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, attendance)],
    });
    expect(await screen.findByText("Juan Pérez")).toBeTruthy();
    expect(await screen.findByText("Matemática")).toBeTruthy();
    expect(screen.getByText("Asistencia: 90% (1 ausencias)")).toBeTruthy();
    expect(screen.getByText("Asistencia: 60% (8 ausencias)")).toBeTruthy();
    expect(screen.getByText("Asistencia: sin registros")).toBeTruthy();
    expect(screen.getByText("Sin notas")).toBeTruthy();
  });

  it("muestra el estado vacío y los errores", async () => {
    const empty = await renderScreen(<ChildDetailScreen route={route} />, {
      session: makeSession("parents"),
      mocks: [ok(GRADES_BY_STUDENT, { studentId: 5 }, { gradesByStudentId: [] }), ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, { attendanceByStudent: [] })],
    });
    expect(await screen.findByText("Sin asignaturas")).toBeTruthy();
    await empty.unmount();
    await renderScreen(<ChildDetailScreen route={route} />, {
      session: makeSession("parents"),
      mocks: [fail(GRADES_BY_STUDENT, { studentId: 5 }), ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, attendance)],
    });
    expect(await screen.findByText("No se pudo cargar la información del estudiante.")).toBeTruthy();
  });
});
