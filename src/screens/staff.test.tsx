import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AttendanceCalendarScreen, CourseAttendanceScreen, GradesScreen, StudentAttendanceScreen, SubjectDetailScreen, SubjectsScreen } from "./staff";
import {
  ATTENDANCE_BY_STUDENT,
  COURSE_ATTENDANCE_SUMMARIES,
  CREATE_GRADE,
  CREATE_SUBJECT,
  DELETE_GRADE,
  ENROLL_STUDENT,
  GET_ALL_STUDENTS,
  GRADES_BY_SUBJECT,
  LIST_COURSES,
  LIST_SUBJECTS,
  LIST_USERS_BY_SUBJECT,
  SUBJECTS_BY_TEACHER,
  SUBJECT_ATTENDANCE_CALENDAR,
  SUBJECT_ATTENDANCE_SUMMARY,
  SUBJECT_BY_ID,
  TAKE_ASIST,
  UNENROLL_STUDENT,
  UPDATE_GRADE,
} from "../graphql";
import { confirmAction, notify } from "../lib/alerts";
import { todayLocal } from "../lib/format";
import { fail, makeNavigation, makeSession, ok, renderScreen } from "../test/utils";

const course = { id: "1", nameCourse: "1° Básico A", level: "Basica" };
const subject = { id: "10", name: "Matemática", numberOfClasses: 40, idTeacher: 1, course };
const juan = { id: "5", firstName: "Juan", lastName: "Pérez", rut: "44.444.444-4", email: "j@test.cl", role: "Student", guardianId: 4 };
const sofia = { id: "6", firstName: "Sofía", lastName: "Rojas", rut: "55.555.555-5", email: "s@test.cl", role: "Student", guardianId: 4 };

const studentSummary = (user: typeof juan, asist: number, abs: number, percentage: number) => ({
  totalAsist: asist,
  totalAbsences: abs,
  percentage,
  user: { id: user.id, firstName: user.firstName, lastName: user.lastName, rut: user.rut },
});

const subjectSummary = {
  subject: { id: "10", name: "Matemática", numberOfClasses: 40, course: { id: "1", nameCourse: "1° Básico A" } },
  students: 2,
  classesHeld: 20,
  totalAsist: 28,
  totalAbsences: 12,
  percentage: 70,
  studentsSummary: [studentSummary(juan, 18, 2, 90), studentSummary(sofia, 10, 10, 50)],
};

const courseSummary = {
  course: { id: "1", nameCourse: "1° Básico A", level: "Basica" },
  students: 2,
  classesHeld: 20,
  totalAsist: 28,
  totalAbsences: 12,
  percentage: 70,
  subjects: [subjectSummary],
  studentsSummary: subjectSummary.studentsSummary,
};

const calendar = {
  subject: { id: "10", name: "Matemática", numberOfClasses: 40, course: { id: "1", nameCourse: "1° Básico A" } },
  days: [
    { date: "2026-10-01", present: 1, absent: 1, percentage: 50 },
    { date: "2026-10-02", present: 0, absent: 1, percentage: 0 },
  ],
  students: [
    {
      totalAsist: 1,
      totalAbsences: 1,
      percentage: 50,
      marks: [
        { date: "2026-10-01", present: true },
        { date: "2026-10-02", present: false },
      ],
      user: { id: "5", firstName: "Juan", lastName: "Pérez", rut: "44.444.444-4" },
    },
    {
      totalAsist: 0,
      totalAbsences: 0,
      percentage: 0,
      marks: [],
      user: { id: "6", firstName: "Sofía", lastName: "Rojas", rut: "55.555.555-5" },
    },
  ],
};

const emptyCourse = {
  course: { id: "2", nameCourse: "3° Básico B", level: "Basica" },
  students: 0,
  classesHeld: 0,
  totalAsist: 0,
  totalAbsences: 0,
  percentage: 0,
  subjects: [],
  studentsSummary: [],
};

describe("SubjectsScreen", () => {
  const teacherMocks = [
    ok(SUBJECTS_BY_TEACHER, { idTeacher: 1 }, { getAllSubjectByIdTeacher: [subject] }),
    ok(LIST_COURSES, undefined, { listCourses: [{ ...course, subjects: [] }] }),
  ];

  it("lista las asignaturas del profesor y navega a sus pantallas", async () => {
    const navigation = makeNavigation();
    await renderScreen(<SubjectsScreen navigation={navigation} />, { session: makeSession("teacher"), mocks: teacherMocks });
    expect(await screen.findByText("Matemática")).toBeTruthy();
    fireEvent.press(screen.getByText("Asistencia"));
    expect(navigation.navigate).toHaveBeenCalledWith("SubjectDetail", { subjectId: 10 });
    fireEvent.press(screen.getByText("Notas"));
    expect(navigation.navigate).toHaveBeenCalledWith("Grades", { subjectId: 10 });
    fireEvent.press(screen.getByText("Asistencia por curso"));
    expect(navigation.navigate).toHaveBeenCalledWith("CourseAttendance");
  });

  it("crea una asignatura", async () => {
    await renderScreen(<SubjectsScreen navigation={makeNavigation()} />, {
      session: makeSession("teacher"),
      mocks: [
        ...teacherMocks,
        ok(CREATE_SUBJECT, { createSubjectInput: { name: "Física", numberOfClasses: 30, courseId: 1 } }, { createSubject: { isCreateSubject: true } }),
      ],
    });
    await screen.findByText("Matemática");
    fireEvent.press(screen.getByText("Nueva asignatura"));
    fireEvent.press(screen.getByText("Crear asignatura"));
    expect(notify).toHaveBeenLastCalledWith("Revisa los datos", expect.any(String));
    fireEvent.changeText(screen.getByLabelText("Nombre"), "Física");
    fireEvent.changeText(screen.getByLabelText("Cantidad de clases"), "30");
    fireEvent.press((await screen.findAllByText("1° Básico A"))[0]);
    fireEvent.press(screen.getByText("Crear asignatura"));
    await waitFor(() => expect(screen.queryByText("Crear asignatura")).toBeNull());
  });

  it("informa cuando el servidor rechaza la creación", async () => {
    await renderScreen(<SubjectsScreen navigation={makeNavigation()} />, {
      session: makeSession("teacher"),
      mocks: [
        ...teacherMocks,
        ok(CREATE_SUBJECT, { createSubjectInput: { name: "Física", numberOfClasses: 30, courseId: 1 } }, { createSubject: { isCreateSubject: false } }),
      ],
    });
    await screen.findByText("Matemática");
    fireEvent.press(screen.getByText("Nueva asignatura"));
    fireEvent.changeText(screen.getByLabelText("Nombre"), "Física");
    fireEvent.changeText(screen.getByLabelText("Cantidad de clases"), "30");
    fireEvent.press((await screen.findAllByText("1° Básico A"))[0]);
    fireEvent.press(screen.getByText("Crear asignatura"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo crear", expect.any(String)));
    fireEvent.press(screen.getByText("Cancelar"));
  });

  it("el administrador ve todas las asignaturas sin poder crear desde la app", async () => {
    await renderScreen(<SubjectsScreen navigation={makeNavigation()} />, {
      session: makeSession("admin"),
      mocks: [ok(LIST_SUBJECTS, undefined, { listSubject: [subject] }), ok(LIST_COURSES, undefined, { listCourses: [] })],
    });
    expect(await screen.findByText("Matemática")).toBeTruthy();
    expect(screen.queryByText("Nueva asignatura")).toBeNull();
  });

  it("muestra estados vacío y de error", async () => {
    const empty = await renderScreen(<SubjectsScreen navigation={makeNavigation()} />, {
      session: makeSession("teacher"),
      mocks: [ok(SUBJECTS_BY_TEACHER, { idTeacher: 1 }, { getAllSubjectByIdTeacher: [] }), ok(LIST_COURSES, undefined, { listCourses: [] })],
    });
    expect(await screen.findByText("No hay asignaturas")).toBeTruthy();
    empty.unmount();
    await renderScreen(<SubjectsScreen navigation={makeNavigation()} />, {
      session: makeSession("teacher"),
      mocks: [fail(SUBJECTS_BY_TEACHER, { idTeacher: 1 }), ok(LIST_COURSES, undefined, { listCourses: [] })],
    });
    expect(await screen.findByText("No se pudieron cargar las asignaturas.")).toBeTruthy();
  });
});

describe("SubjectDetailScreen", () => {
  const route = { params: { subjectId: 10 } };
  const enrolled = {
    listUsersBySubject: [{ user: { id: "5", firstName: "Juan", lastName: "Pérez", rut: "44.444.444-4", email: "j@test.cl" }, totalAsist: 18, totalAbsences: 2 }],
  };
  const baseMocks = (numberOfClasses = 40) => [
    ok(SUBJECT_BY_ID, { id: 10 }, { subjectById: { ...subject, numberOfClasses } }),
    ok(LIST_USERS_BY_SUBJECT, { idSubject: 10 }, enrolled),
    ok(GET_ALL_STUDENTS, undefined, { getAllStudents: [juan, sofia] }),
    ok(SUBJECT_ATTENDANCE_SUMMARY, { subjectId: 10 }, { subjectAttendanceSummary: subjectSummary }),
    ok(SUBJECT_ATTENDANCE_CALENDAR, { subjectId: 10 }, { subjectAttendanceCalendar: calendar }),
  ];
  const render = (mocks = baseMocks(), navigation = makeNavigation()) =>
    renderScreen(<SubjectDetailScreen route={route} navigation={navigation} />, { session: makeSession("teacher"), mocks });

  it("muestra el resumen global y la lista de asistencia", async () => {
    await render();
    expect(await screen.findByText("Asistencia global")).toBeTruthy();
    expect(await screen.findByText("Juan Pérez")).toBeTruthy();
    expect(screen.getByText(/18 asist\. · 2 aus\. · 90%/)).toBeTruthy();
    expect(screen.getByText(/20 de 40 clases registradas/)).toBeTruthy();
  });

  it("registra la asistencia del día", async () => {
    await render([
      ...baseMocks(),
      ok(TAKE_ASIST, { createAsistInput: { date: todayLocal(), asistencias: [{ idUser: 5, idSubject: 10, asist: 0, absences: 1 }] } }, { takeAsist: true }),
    ]);
    await screen.findByText("Juan Pérez");
    fireEvent(screen.getByRole("switch"), "valueChange", false);
    fireEvent.press(screen.getByText("Registrar asistencia"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Asistencia registrada"));
  });

  it("carga y corrige la asistencia de una fecha ya registrada", async () => {
    await render([
      ...baseMocks(),
      ok(TAKE_ASIST, { createAsistInput: { date: "2026-10-02", asistencias: [{ idUser: 5, idSubject: 10, asist: 1, absences: 0 }] } }, { takeAsist: true }),
    ]);
    await screen.findByText("Juan Pérez");
    fireEvent.changeText(screen.getByLabelText("Fecha de la clase (AAAA-MM-DD)"), "2026-10-02");
    expect(await screen.findByText("Ya registrada: se actualizará")).toBeTruthy();
    expect(screen.getByRole("switch").props.value).toBe(false);
    fireEvent(screen.getByRole("switch"), "valueChange", true);
    fireEvent.press(screen.getByText("Registrar asistencia"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Asistencia registrada"));
  });

  it("rechaza fechas con formato inválido o futuras", async () => {
    await render();
    await screen.findByText("Juan Pérez");
    fireEvent.changeText(screen.getByLabelText("Fecha de la clase (AAAA-MM-DD)"), "24-10-2026");
    fireEvent.press(screen.getByText("Registrar asistencia"));
    expect(notify).toHaveBeenCalledWith("Revisa los datos", "Ingresa una fecha válida (AAAA-MM-DD) que no sea futura.");
  });

  it("abre el calendario de asistencia", async () => {
    const navigation = makeNavigation();
    await render(baseMocks(), navigation);
    await screen.findByText("Juan Pérez");
    fireEvent.press(screen.getByText("Ver calendario de asistencia"));
    expect(navigation.navigate).toHaveBeenCalledWith("AttendanceCalendar", { subjectId: 10 });
  });

  it("informa cuando falla el registro", async () => {
    await render([...baseMocks(), fail(TAKE_ASIST, { createAsistInput: { date: todayLocal(), asistencias: [{ idUser: 5, idSubject: 10, asist: 1, absences: 0 }] } })]);
    await screen.findByText("Juan Pérez");
    fireEvent.press(screen.getByText("Registrar asistencia"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo registrar", expect.any(String)));
  });

  it("inscribe y retira estudiantes", async () => {
    await render([
      ...baseMocks(),
      ok(ENROLL_STUDENT, { idUser: 6, idSubject: 10 }, { enrollStudent: true }),
      ok(UNENROLL_STUDENT, { idUser: 5, idSubject: 10 }, { unenrollStudent: true }),
    ]);
    await screen.findByText("Juan Pérez");
    fireEvent.press(screen.getByText("Inscribir"));
    fireEvent.press(screen.getByText("Quitar"));
    await waitFor(() => expect(confirmAction).toHaveBeenCalled());
  });

  it("reporta errores de inscripción y respeta la cancelación al retirar", async () => {
    await render([...baseMocks(), fail(ENROLL_STUDENT, { idUser: 6, idSubject: 10 }), fail(UNENROLL_STUDENT, { idUser: 5, idSubject: 10 })]);
    await screen.findByText("Juan Pérez");
    fireEvent.press(screen.getByText("Inscribir"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo inscribir", expect.any(String)));
    (confirmAction as jest.Mock).mockResolvedValueOnce(false);
    fireEvent.press(screen.getByText("Quitar"));
    await waitFor(() => expect(confirmAction).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByText("Quitar"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo quitar", expect.any(String)));
  });

  it("abre la ficha de asistencia de un estudiante", async () => {
    const navigation = makeNavigation();
    await render(baseMocks(), navigation);
    fireEvent.press(await screen.findByText("Juan Pérez"));
    expect(navigation.navigate).toHaveBeenCalledWith("StudentAttendance", { student: expect.objectContaining({ id: "5" }) });
  });

  it("navega a las notas", async () => {
    const navigation = makeNavigation();
    await render(baseMocks(), navigation);
    await screen.findByText("Juan Pérez");
    fireEvent.press(screen.getByText("Ir a notas"));
    expect(navigation.navigate).toHaveBeenCalledWith("Grades", { subjectId: 10 });
  });

  it("muestra estados vacíos y de error", async () => {
    await render([
      ok(SUBJECT_BY_ID, { id: 10 }, { subjectById: subject }),
      ok(LIST_USERS_BY_SUBJECT, { idSubject: 10 }, { listUsersBySubject: [] }),
      ok(GET_ALL_STUDENTS, undefined, { getAllStudents: [] }),
      ok(SUBJECT_ATTENDANCE_SUMMARY, { subjectId: 10 }, { subjectAttendanceSummary: { ...subjectSummary, totalAsist: 0, totalAbsences: 0, studentsSummary: [] } }),
    ]);
    expect(await screen.findByText("Sin estudiantes inscritos")).toBeTruthy();
    expect(screen.getByText("No hay más estudiantes disponibles.")).toBeTruthy();
    fireEvent.press(screen.getByText("Ir a notas"));
  });

  it("informa cuando la asignatura no existe", async () => {
    await render([
      ok(SUBJECT_BY_ID, { id: 10 }, { subjectById: null }),
      ok(LIST_USERS_BY_SUBJECT, { idSubject: 10 }, enrolled),
      ok(GET_ALL_STUDENTS, undefined, { getAllStudents: [] }),
      ok(SUBJECT_ATTENDANCE_SUMMARY, { subjectId: 10 }, { subjectAttendanceSummary: subjectSummary }),
    ]);
    expect(await screen.findByText("La asignatura no existe o no está disponible.")).toBeTruthy();
  });
});

describe("GradesScreen", () => {
  const route = { params: { subjectId: 10 } };
  const enrolled = (user: typeof juan) => ({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, rut: user.rut }, totalAsist: 1, totalAbsences: 0 });
  const baseMocks = [
    ok(SUBJECT_BY_ID, { id: 10 }, { subjectById: subject }),
    ok(LIST_USERS_BY_SUBJECT, { idSubject: 10 }, { listUsersBySubject: [enrolled(juan), enrolled(sofia)] }),
    ok(GRADES_BY_SUBJECT, { subjectId: 10 }, { gradesBySubjectId: [{ id: "1", grade: 5.5, studentId: 5, subjectId: 10 }] }),
  ];
  const render = (mocks = baseMocks) => renderScreen(<GradesScreen route={route} />, { session: makeSession("teacher"), mocks });

  it("muestra las notas por estudiante", async () => {
    await render();
    expect(await screen.findByDisplayValue("5.5")).toBeTruthy();
    expect(screen.getByText("Juan Pérez")).toBeTruthy();
    expect(screen.getByText("Prom. 5.5")).toBeTruthy();
  });

  it("actualiza una nota existente", async () => {
    await render([
      ...baseMocks,
      ok(UPDATE_GRADE, { id: 1, updateGradeDto: { grade: 6.5, studentId: 5, subjectId: 10 } }, { updateGrade: { id: "1" } }),
    ]);
    fireEvent.changeText(await screen.findByDisplayValue("5.5"), "6,5");
    fireEvent.press(screen.getByText("Guardar cambios (1)"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Notas guardadas"));
  });

  it("crea una nota nueva", async () => {
    await render([
      ...baseMocks,
      ok(CREATE_GRADE, { createGradeDto: { grade: 4.2, studentId: 6, subjectId: 10 } }, { createGrade: { id: "9" } }),
    ]);
    await screen.findByDisplayValue("5.5");
    fireEvent.press(screen.getAllByText("Agregar nota")[1]);
    const inputs = screen.getAllByPlaceholderText("0,0");
    fireEvent.changeText(inputs[inputs.length - 1], "4.2");
    fireEvent.press(screen.getByText("Guardar cambios (1)"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Notas guardadas"));
  });

  it("rechaza notas fuera de la escala", async () => {
    await render();
    fireEvent.changeText(await screen.findByDisplayValue("5.5"), "8");
    fireEvent.press(screen.getByText("Guardar cambios (1)"));
    expect(notify).toHaveBeenCalledWith("Revisa los datos", "Todas las notas deben estar entre 1,0 y 7,0.");
  });

  it("elimina notas guardadas y descarta las no guardadas", async () => {
    await render([...baseMocks, ok(DELETE_GRADE, { id: 1 }, { deleteGrade: true })]);
    await screen.findByDisplayValue("5.5");
    fireEvent.press(screen.getAllByText("Agregar nota")[1]);
    expect(screen.getAllByPlaceholderText("0,0")).toHaveLength(2);
    fireEvent.press(screen.getAllByText("×")[1]);
    await waitFor(() => expect(screen.getAllByPlaceholderText("0,0")).toHaveLength(1));
    fireEvent.press(screen.getByText("×"));
    await waitFor(() => expect(screen.queryByDisplayValue("5.5")).toBeNull());
  });

  it("no elimina si se cancela o el servidor falla", async () => {
    await render([...baseMocks, fail(DELETE_GRADE, { id: 1 })]);
    await screen.findByDisplayValue("5.5");
    (confirmAction as jest.Mock).mockResolvedValueOnce(false);
    fireEvent.press(screen.getByText("×"));
    await waitFor(() => expect(confirmAction).toHaveBeenCalledTimes(1));
    expect(screen.getByDisplayValue("5.5")).toBeTruthy();
    fireEvent.press(screen.getByText("×"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudo eliminar", expect.any(String)));
  });

  it("informa cuando falla el guardado y cuando no hay cambios", async () => {
    await render([...baseMocks, fail(UPDATE_GRADE, { id: 1, updateGradeDto: { grade: 6, studentId: 5, subjectId: 10 } })]);
    await screen.findByDisplayValue("5.5");
    fireEvent.press(screen.getByText("Guardar cambios"));
    fireEvent.changeText(screen.getByDisplayValue("5.5"), "6");
    fireEvent.press(screen.getByText("Guardar cambios (1)"));
    await waitFor(() => expect(notify).toHaveBeenCalledWith("No se pudieron guardar", expect.any(String)));
  });

  it("muestra el estado vacío", async () => {
    await render([
      ok(SUBJECT_BY_ID, { id: 10 }, { subjectById: subject }),
      ok(LIST_USERS_BY_SUBJECT, { idSubject: 10 }, { listUsersBySubject: [] }),
      ok(GRADES_BY_SUBJECT, { subjectId: 10 }, { gradesBySubjectId: [] }),
    ]);
    expect(await screen.findByText("Sin estudiantes inscritos")).toBeTruthy();
  });
});

describe("CourseAttendanceScreen", () => {
  const render = (
    mocks = [ok(COURSE_ATTENDANCE_SUMMARIES, undefined, { courseAttendanceSummaries: [courseSummary, emptyCourse] })],
    navigation = makeNavigation(),
  ) => renderScreen(<CourseAttendanceScreen navigation={navigation} />, { session: makeSession("teacher"), mocks });

  it("muestra el curso, sus asignaturas y los estudiantes en riesgo", async () => {
    await render();
    expect((await screen.findAllByText("1° Básico A")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("70%").length).toBeGreaterThan(0);
    expect(screen.getByText("En riesgo")).toBeTruthy();
    expect(screen.getByText(/2 estudiantes · 28 asistencias · 12 ausencias/)).toBeTruthy();
  });

  it("abre el detalle de una asignatura y de un estudiante", async () => {
    const navigation = makeNavigation();
    await render(undefined, navigation);
    fireEvent.press(await screen.findByText(/Matemática/));
    expect(navigation.navigate).toHaveBeenCalledWith("SubjectDetail", { subjectId: 10 });
    fireEvent.press(screen.getByText("Sofía Rojas"));
    expect(navigation.navigate).toHaveBeenCalledWith("StudentAttendance", { student: expect.objectContaining({ id: "6" }) });
  });

  it("cambia de curso", async () => {
    await render();
    fireEvent.press(await screen.findByText("3° Básico B"));
    expect(await screen.findByText(/0 estudiantes/)).toBeTruthy();
    expect(screen.getAllByText("Sin registros").length).toBeGreaterThan(0);
  });

  it("muestra estados vacío y de error", async () => {
    const empty = await render([ok(COURSE_ATTENDANCE_SUMMARIES, undefined, { courseAttendanceSummaries: [] })]);
    expect(await screen.findByText("No hay cursos registrados")).toBeTruthy();
    empty.unmount();
    await render([fail(COURSE_ATTENDANCE_SUMMARIES, undefined)]);
    expect(await screen.findByText("No se pudo cargar el resumen de asistencia.")).toBeTruthy();
  });
});

describe("StudentAttendanceScreen", () => {
  const route = { params: { student: { id: "5", firstName: "Juan", lastName: "Pérez", rut: "44.444.444-4" } } };
  const rows = {
    attendanceByStudent: [
      { totalAsist: 18, totalAbsences: 2, subject: { id: "10", name: "Matemática", numberOfClasses: 40, course: { nameCourse: "1° Básico A" } } },
      { totalAsist: 0, totalAbsences: 0, subject: { id: "11", name: "Inglés", numberOfClasses: 40, course: { nameCourse: "1° Básico A" } } },
    ],
  };

  it("muestra la asistencia del estudiante en todas sus asignaturas", async () => {
    const navigation = makeNavigation();
    await renderScreen(<StudentAttendanceScreen route={route} navigation={navigation} />, {
      session: makeSession("teacher"),
      mocks: [ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, rows)],
    });
    expect(await screen.findByText("Juan Pérez")).toBeTruthy();
    expect(await screen.findByText(/2 asignaturas · 18 asistencias · 2 ausencias/)).toBeTruthy();
    expect(screen.getByText("18 asistencias · 2 ausencias")).toBeTruthy();
    fireEvent.press(screen.getByText(/Matemática/));
    expect(navigation.navigate).toHaveBeenCalledWith("SubjectDetail", { subjectId: 10 });
  });

  it("muestra el estado vacío y los errores", async () => {
    const empty = await renderScreen(<StudentAttendanceScreen route={route} navigation={makeNavigation()} />, {
      session: makeSession("teacher"),
      mocks: [ok(ATTENDANCE_BY_STUDENT, { studentId: 5 }, { attendanceByStudent: [] })],
    });
    expect(await screen.findByText("Sin asignaturas")).toBeTruthy();
    empty.unmount();
    await renderScreen(<StudentAttendanceScreen route={route} navigation={makeNavigation()} />, {
      session: makeSession("teacher"),
      mocks: [fail(ATTENDANCE_BY_STUDENT, { studentId: 5 })],
    });
    expect(await screen.findByText("No se pudo cargar la asistencia del estudiante.")).toBeTruthy();
  });
});

describe("AttendanceCalendarScreen", () => {
  const route = { params: { subjectId: 10 } };
  const render = (mocks: ReturnType<typeof ok>[], navigation = makeNavigation()) =>
    renderScreen(<AttendanceCalendarScreen route={route} navigation={navigation} />, { session: makeSession("teacher"), mocks });

  it("dibuja un cuadrado por estudiante y por día registrado", async () => {
    const navigation = makeNavigation();
    await render([ok(SUBJECT_ATTENDANCE_CALENDAR, { subjectId: 10 }, { subjectAttendanceCalendar: calendar })], navigation);
    expect(await screen.findByText("Calendario · Matemática")).toBeTruthy();
    expect(screen.getByText(/2 días registrados/)).toBeTruthy();
    expect(screen.getByLabelText("Juan 2026-10-01")).toBeTruthy();
    expect(screen.getByLabelText("Sofía 2026-10-02")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    expect(screen.getByText("-")).toBeTruthy();
    fireEvent.press(screen.getByText("Juan Pérez"));
    expect(navigation.navigate).toHaveBeenCalledWith("StudentAttendance", { student: expect.objectContaining({ id: "5" }) });
  });

  it("explica cuándo aún no hay días registrados", async () => {
    await render([ok(SUBJECT_ATTENDANCE_CALENDAR, { subjectId: 10 }, { subjectAttendanceCalendar: { ...calendar, days: [], students: [] } })]);
    expect(await screen.findByText("Aún no hay días registrados")).toBeTruthy();
  });

  it("informa errores y asignaturas inexistentes", async () => {
    const failed = await render([fail(SUBJECT_ATTENDANCE_CALENDAR, { subjectId: 10 })]);
    expect(await screen.findByText("No se pudo cargar el calendario de asistencia.")).toBeTruthy();
    failed.unmount();
    await render([ok(SUBJECT_ATTENDANCE_CALENDAR, { subjectId: 10 }, { subjectAttendanceCalendar: null })]);
    expect(await screen.findByText("La asignatura no existe o no está disponible.")).toBeTruthy();
  });
});
