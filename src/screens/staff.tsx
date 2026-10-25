import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import { Badge, Button, Card, Empty, ErrorBox, Field, Loading, Meter, Row, Screen, SectionTitle, Title } from "../components/ui";
import {
  ATTENDANCE_BY_STUDENT,
  COURSE_ATTENDANCE_SUMMARIES,
  CourseSummaryDto,
  CREATE_GRADE,
  CREATE_SUBJECT,
  CourseDto,
  DELETE_GRADE,
  ENROLL_STUDENT,
  GET_ALL_STUDENTS,
  GRADES_BY_SUBJECT,
  GradeDto,
  LIST_COURSES,
  LIST_SUBJECTS,
  LIST_USERS_BY_SUBJECT,
  SUBJECTS_BY_TEACHER,
  SUBJECT_ATTENDANCE_CALENDAR,
  SUBJECT_ATTENDANCE_SUMMARY,
  SUBJECT_BY_ID,
  SubjectCalendarDto,
  SubjectDto,
  SubjectSummaryDto,
  TAKE_ASIST,
  UNENROLL_STUDENT,
  UPDATE_GRADE,
  UserDto,
} from "../graphql";
import { confirmAction, errorMessage, notify } from "../lib/alerts";
import { average, formatDay, formatGrade, todayLocal } from "../lib/format";
import { colors, font, radius, spacing } from "../theme";

const CELL = 26;

interface Enrolled {
  user: Pick<UserDto, "id" | "firstName" | "lastName" | "rut">;
  totalAsist: number;
  totalAbsences: number;
}

const tone = (value: number): "success" | "error" | "neutral" => (!value ? "neutral" : value >= 4 ? "success" : "error");

export const SubjectsScreen = ({ navigation }: { navigation: any }) => {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [classes, setClasses] = useState("");
  const [courseId, setCourseId] = useState("");

  const teacherQuery = useQuery<{ getAllSubjectByIdTeacher: SubjectDto[] }>(SUBJECTS_BY_TEACHER, {
    variables: { idTeacher: session?.id },
    skip: isAdmin,
  });
  const adminQuery = useQuery<{ listSubject: SubjectDto[] }>(LIST_SUBJECTS, { skip: !isAdmin });
  const courses = useQuery<{ listCourses: CourseDto[] }>(LIST_COURSES);
  const [createSubject, createState] = useMutation(CREATE_SUBJECT, {
    refetchQueries: [LIST_SUBJECTS, SUBJECTS_BY_TEACHER],
  });

  const subjects = (isAdmin ? adminQuery.data?.listSubject : teacherQuery.data?.getAllSubjectByIdTeacher) ?? [];
  const loading = isAdmin ? adminQuery.loading : teacherQuery.loading;
  const error = isAdmin ? adminQuery.error : teacherQuery.error;

  const handleCreate = async () => {
    const total = Number(classes);
    if (!name.trim() || !courseId || !Number.isInteger(total) || total <= 0) {
      notify("Revisa los datos", "Completa el nombre, el curso y una cantidad de clases mayor a cero.");
      return;
    }
    try {
      const { data } = await createSubject({
        variables: {
          createSubjectInput: { name: name.trim(), numberOfClasses: total, courseId: Number(courseId) },
        },
      });
      if (!data?.createSubject?.isCreateSubject) {
        throw new Error("No se pudo crear la asignatura");
      }
      setName("");
      setClasses("");
      setCourseId("");
      setShowForm(false);
    } catch (err) {
      notify("No se pudo crear", errorMessage(err));
    }
  };

  return (
    <Screen>
      <Title subtitle={isAdmin ? "Todas las asignaturas del colegio" : "Gestiona la asistencia y las notas"}>
        Asignaturas
      </Title>
      <Button
        label="Asistencia por curso"
        variant="outline"
        onPress={() => navigation.navigate("CourseAttendance")}
      />
      {!isAdmin && (
        <Button
          label={showForm ? "Cancelar" : "Nueva asignatura"}
          variant={showForm ? "outline" : "primary"}
          onPress={() => setShowForm(!showForm)}
        />
      )}
      {showForm && (
        <Card>
          <Field label="Nombre" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <Field label="Cantidad de clases" value={classes} onChangeText={setClasses} keyboardType="number-pad" />
          <Text style={styles.label}>Curso</Text>
          <View style={styles.wrap}>
            {(courses.data?.listCourses ?? []).map((course) => (
              <Button
                key={course.id}
                label={course.nameCourse}
                size="sm"
                variant={courseId === course.id ? "primary" : "outline"}
                onPress={() => setCourseId(course.id)}
              />
            ))}
          </View>
          <Button label="Crear asignatura" onPress={handleCreate} loading={createState.loading} />
        </Card>
      )}
      {error ? (
        <ErrorBox message="No se pudieron cargar las asignaturas." />
      ) : loading && subjects.length === 0 ? (
        <Loading />
      ) : subjects.length === 0 ? (
        <Empty title="No hay asignaturas" description="Crea la primera asignatura para comenzar." />
      ) : (
        subjects.map((subject) => (
          <Card key={subject.id}>
            <Row style={styles.between}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{subject.name}</Text>
                <Text style={styles.muted}>{subject.course?.nameCourse}</Text>
              </View>
              <Badge label={`${subject.numberOfClasses} clases`} />
            </Row>
            <Row>
              <Button
                label="Asistencia"
                size="sm"
                style={styles.flex}
                onPress={() => navigation.navigate("SubjectDetail", { subjectId: Number(subject.id) })}
              />
              <Button
                label="Notas"
                size="sm"
                variant="outline"
                style={styles.flex}
                onPress={() => navigation.navigate("Grades", { subjectId: Number(subject.id) })}
              />
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
};

export const SubjectDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const subjectId: number = route.params.subjectId;
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(todayLocal());

  const subjectQuery = useQuery<{ subjectById: SubjectDto | null }>(SUBJECT_BY_ID, { variables: { id: subjectId } });
  const enrolledQuery = useQuery<{ listUsersBySubject: Enrolled[] }>(LIST_USERS_BY_SUBJECT, {
    variables: { idSubject: subjectId },
    fetchPolicy: "network-only",
  });
  const studentsQuery = useQuery<{ getAllStudents: UserDto[] }>(GET_ALL_STUDENTS);
  const summaryQuery = useQuery<{ subjectAttendanceSummary: SubjectSummaryDto }>(SUBJECT_ATTENDANCE_SUMMARY, {
    variables: { subjectId },
    fetchPolicy: "network-only",
  });
  const calendarQuery = useQuery<{ subjectAttendanceCalendar: SubjectCalendarDto }>(SUBJECT_ATTENDANCE_CALENDAR, {
    variables: { subjectId },
    fetchPolicy: "network-only",
  });
  const refetchQueries = [
    { query: LIST_USERS_BY_SUBJECT, variables: { idSubject: subjectId } },
    { query: SUBJECT_ATTENDANCE_SUMMARY, variables: { subjectId } },
    { query: SUBJECT_ATTENDANCE_CALENDAR, variables: { subjectId } },
  ];
  const [takeAsist, takeState] = useMutation(TAKE_ASIST, { refetchQueries });
  const [enroll] = useMutation(ENROLL_STUDENT, { refetchQueries });
  const [unenroll] = useMutation(UNENROLL_STUDENT, { refetchQueries });

  const enrolled = useMemo(() => enrolledQuery.data?.listUsersBySubject ?? [], [enrolledQuery.data]);
  const subject = subjectQuery.data?.subjectById;
  const available = (studentsQuery.data?.getAllStudents ?? []).filter(
    (student) => !enrolled.some((item) => item.user.id === student.id),
  );
  const summary = summaryQuery.data?.subjectAttendanceSummary;
  const held = enrolled.reduce((max, item) => Math.max(max, item.totalAsist + item.totalAbsences), 0);

  const savedMarks = useMemo(() => {
    const marks: Record<string, boolean> = {};
    calendarQuery.data?.subjectAttendanceCalendar.students.forEach((student) => {
      const mark = student.marks.find((item) => item.date === date);
      if (mark) {
        marks[student.user.id] = mark.present;
      }
    });
    return marks;
  }, [calendarQuery.data, date]);
  const alreadyRegistered = Object.keys(savedMarks).length > 0;

  useEffect(() => {
    setPresent(() => {
      const next: Record<string, boolean> = {};
      enrolled.forEach((item) => {
        next[item.user.id] = savedMarks[item.user.id] ?? true;
      });
      return next;
    });
  }, [enrolled, savedMarks]);

  const handleSave = async () => {
    if (enrolled.length === 0) {
      notify("Sin estudiantes", "Inscribe estudiantes para tomar asistencia.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayLocal()) {
      notify("Revisa los datos", "Ingresa una fecha válida (AAAA-MM-DD) que no sea futura.");
      return;
    }
    try {
      await takeAsist({
        variables: {
          createAsistInput: {
            date,
            asistencias: enrolled.map((item) => ({
              idUser: Number(item.user.id),
              idSubject: subjectId,
              asist: present[item.user.id] ? 1 : 0,
              absences: present[item.user.id] ? 0 : 1,
            })),
          },
        },
      });
      notify("Asistencia registrada");
    } catch (error) {
      notify("No se pudo registrar", errorMessage(error));
    }
  };

  const handleEnroll = async (student: UserDto) => {
    try {
      await enroll({ variables: { idUser: Number(student.id), idSubject: subjectId } });
    } catch (error) {
      notify("No se pudo inscribir", errorMessage(error));
    }
  };

  const handleUnenroll = async (item: Enrolled) => {
    if (!(await confirmAction("Quitar estudiante", `${item.user.firstName} ${item.user.lastName} dejará la asignatura.`, "Quitar"))) {
      return;
    }
    try {
      await unenroll({ variables: { idUser: Number(item.user.id), idSubject: subjectId } });
    } catch (error) {
      notify("No se pudo quitar", errorMessage(error));
    }
  };

  if (subjectQuery.loading && !subject) {
    return <Loading />;
  }
  if (!subject) {
    return (
      <Screen>
        <ErrorBox message="La asignatura no existe o no está disponible." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title subtitle={`${subject.course?.nameCourse} · ${held} de ${subject.numberOfClasses} clases`}>{subject.name}</Title>
      <Button label="Ver calendario de asistencia" variant="outline" onPress={() => navigation.navigate("AttendanceCalendar", { subjectId })} />
      <Button label="Ir a notas" variant="outline" onPress={() => navigation.navigate("Grades", { subjectId })} />
      {summary && (
        <Card>
          <Text style={styles.label}>Asistencia global</Text>
          <Meter percentage={summary.percentage} empty={!(summary.totalAsist + summary.totalAbsences)} />
          <Text style={styles.muted}>
            {summary.classesHeld} de {subject.numberOfClasses} clases registradas · {summary.totalAsist} asistencias · {summary.totalAbsences} ausencias
          </Text>
        </Card>
      )}
      <SectionTitle>Registro de asistencia</SectionTitle>
      <Field label="Fecha de la clase (AAAA-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-10-24" />
      {alreadyRegistered && <Badge label="Ya registrada: se actualizará" />}
      {enrolled.length === 0 ? (
        <Empty title="Sin estudiantes inscritos" description="Inscríbelos desde la lista inferior." />
      ) : (
        <>
          <Card>
            {enrolled.map((item) => (
              <View key={item.user.id} style={styles.studentRow}>
                <View style={styles.flex}>
                  <Pressable onPress={() => navigation.navigate("StudentAttendance", { student: item.user })}>
                    <Text style={styles.link}>
                      {item.user.firstName} {item.user.lastName}
                    </Text>
                  </Pressable>
                  <Text style={styles.muted}>
                    {item.totalAsist} asist. · {item.totalAbsences} aus. ·{" "}
                    {item.totalAsist + item.totalAbsences
                      ? `${Math.round((item.totalAsist / (item.totalAsist + item.totalAbsences)) * 100)}%`
                      : "sin registros"}
                  </Text>
                </View>
                <Switch
                  value={present[item.user.id] ?? true}
                  onValueChange={(value) => setPresent({ ...present, [item.user.id]: value })}
                  trackColor={{ true: colors.success, false: colors.border }}
                />
                <Button label="Quitar" variant="danger" size="sm" onPress={() => handleUnenroll(item)} />
              </View>
            ))}
          </Card>
          <Button label="Registrar asistencia" onPress={handleSave} loading={takeState.loading} />
        </>
      )}
      <SectionTitle>Inscribir estudiantes</SectionTitle>
      {available.length === 0 ? (
        <Text style={styles.muted}>No hay más estudiantes disponibles.</Text>
      ) : (
        <Card>
          {available.map((student) => (
            <View key={student.id} style={styles.studentRow}>
              <View style={styles.flex}>
                <Text style={styles.body}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.muted}>{student.rut}</Text>
              </View>
              <Button label="Inscribir" size="sm" variant="outline" onPress={() => handleEnroll(student)} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
};

interface Entry {
  key: string;
  id?: string;
  original?: number;
  value: string;
}

let counter = 0;
const parse = (value: string): number => Number(value.replace(",", "."));
const isValid = (value: string): boolean => {
  const n = parse(value);
  return value.trim() !== "" && !Number.isNaN(n) && n >= 1 && n <= 7;
};

export const GradesScreen = ({ route }: { route: any }) => {
  const subjectId: number = route.params.subjectId;
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [saving, setSaving] = useState(false);

  const subjectQuery = useQuery<{ subjectById: SubjectDto | null }>(SUBJECT_BY_ID, { variables: { id: subjectId } });
  const studentsQuery = useQuery<{ listUsersBySubject: Enrolled[] }>(LIST_USERS_BY_SUBJECT, {
    variables: { idSubject: subjectId },
  });
  const gradesQuery = useQuery<{ gradesBySubjectId: GradeDto[] }>(GRADES_BY_SUBJECT, {
    variables: { subjectId },
    fetchPolicy: "network-only",
  });
  const [createGrade] = useMutation(CREATE_GRADE);
  const [updateGrade] = useMutation(UPDATE_GRADE);
  const [deleteGrade] = useMutation(DELETE_GRADE);
  const students = studentsQuery.data?.listUsersBySubject ?? [];

  useEffect(() => {
    if (!gradesQuery.data) {
      return;
    }
    const grouped: Record<string, Entry[]> = {};
    gradesQuery.data.gradesBySubjectId.forEach((grade) => {
      const key = String(grade.studentId);
      grouped[key] = [
        ...(grouped[key] ?? []),
        { key: grade.id, id: grade.id, original: Number(grade.grade), value: Number(grade.grade).toFixed(1) },
      ];
    });
    setEntries(grouped);
  }, [gradesQuery.data]);

  const setValue = (studentId: string, key: string, value: string) =>
    setEntries((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] ?? []).map((entry) => (entry.key === key ? { ...entry, value } : entry)),
    }));

  const addEntry = (studentId: string) =>
    setEntries((prev) => ({
      ...prev,
      [studentId]: [...(prev[studentId] ?? []), { key: `new-${counter++}`, value: "" }],
    }));

  const removeEntry = async (studentId: string, entry: Entry) => {
    if (entry.id) {
      if (!(await confirmAction("Eliminar nota", "La nota se eliminará de forma permanente.", "Eliminar"))) {
        return;
      }
      try {
        await deleteGrade({ variables: { id: Number(entry.id) } });
      } catch (error) {
        notify("No se pudo eliminar", errorMessage(error));
        return;
      }
    }
    setEntries((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] ?? []).filter((item) => item.key !== entry.key),
    }));
  };

  const pending = Object.values(entries)
    .flat()
    .filter((entry) => !entry.id || (entry.original !== undefined && parse(entry.value) !== entry.original));

  const handleSave = async () => {
    if (Object.values(entries).flat().some((entry) => !isValid(entry.value))) {
      notify("Revisa los datos", "Todas las notas deben estar entre 1,0 y 7,0.");
      return;
    }
    if (pending.length === 0) {
      notify("Sin cambios", "No hay notas por guardar.");
      return;
    }
    setSaving(true);
    try {
      for (const [studentId, list] of Object.entries(entries)) {
        for (const entry of list) {
          const grade = Math.round(parse(entry.value) * 10) / 10;
          if (!entry.id) {
            await createGrade({ variables: { createGradeDto: { grade, studentId: Number(studentId), subjectId } } });
          } else if (entry.original !== grade) {
            await updateGrade({
              variables: { id: Number(entry.id), updateGradeDto: { grade, studentId: Number(studentId), subjectId } },
            });
          }
        }
      }
      await gradesQuery.refetch();
      notify("Notas guardadas");
    } catch (error) {
      notify("No se pudieron guardar", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const subject = subjectQuery.data?.subjectById;

  return (
    <Screen>
      <Title subtitle={`${subject?.course?.nameCourse ?? ""} · Escala 1,0 a 7,0`}>{`Notas · ${subject?.name ?? ""}`}</Title>
      {studentsQuery.loading && students.length === 0 ? (
        <Loading />
      ) : students.length === 0 ? (
        <Empty title="Sin estudiantes inscritos" description="Inscribe estudiantes para registrar notas." />
      ) : (
        <>
          {students.map(({ user }) => {
            const list = entries[user.id] ?? [];
            const avg = average(list.filter((e) => isValid(e.value)).map((e) => parse(e.value)));
            return (
              <Card key={user.id}>
                <Row style={styles.between}>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.muted}>{user.rut}</Text>
                  </View>
                  <Badge label={`Prom. ${formatGrade(avg)}`} tone={tone(avg)} />
                </Row>
                <View style={styles.wrap}>
                  {list.map((entry) => (
                    <View key={entry.key} style={styles.gradeBox}>
                      <TextInput
                        style={[styles.gradeInput, entry.value && !isValid(entry.value) ? styles.gradeInvalid : null]}
                        value={entry.value}
                        onChangeText={(v) => setValue(user.id, entry.key, v)}
                        keyboardType="decimal-pad"
                        placeholder="0,0"
                        placeholderTextColor={colors.muted}
                      />
                      <Button label="×" variant="danger" size="sm" onPress={() => removeEntry(user.id, entry)} />
                    </View>
                  ))}
                </View>
                <Button label="Agregar nota" variant="outline" size="sm" onPress={() => addEntry(user.id)} />
              </Card>
            );
          })}
          <Button
            label={`Guardar cambios${pending.length ? ` (${pending.length})` : ""}`}
            onPress={handleSave}
            loading={saving}
            disabled={pending.length === 0}
          />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  between: { justifyContent: "space-between" },
  label: { fontSize: font.body, fontWeight: "500", color: colors.neutral },
  cardTitle: { fontSize: font.section, fontWeight: "600", color: colors.neutral },
  muted: { fontSize: font.small, color: colors.muted },
  body: { fontSize: font.body, color: colors.text },
  link: { fontSize: font.body, fontWeight: "500", color: colors.secondary },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  gradeBox: { flexDirection: "row", alignItems: "center", gap: 2 },
  gradeInput: {
    width: 60,
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    textAlign: "center",
    fontSize: font.body,
    color: colors.text,
  },
  gradeInvalid: { borderColor: colors.error },
  legend: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  legendBox: { width: 14, height: 14, borderRadius: 3 },
  gridRow: { flexDirection: "row" },
  nameColumn: { width: 120 },
  headerCell: { height: 44 },
  nameCell: { height: 36, justifyContent: "center" },
  dataRow: { flexDirection: "row", height: 36 },
  dayHeader: { width: 36, height: 44, alignItems: "center", justifyContent: "center" },
  totalHeader: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dayWeekday: { fontSize: 10, color: colors.muted, textTransform: "uppercase" },
  dayNumber: { fontSize: font.small, fontWeight: "600", color: colors.neutral },
  cellWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  cell: { width: CELL - 2, height: CELL - 2, borderRadius: 4 },
  totalCell: { width: 44, height: 36, alignItems: "center", justifyContent: "center" },
  percentText: { fontSize: font.small, fontWeight: "600", color: colors.neutral },
  summaryRow: { gap: 6, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});

export const CourseAttendanceScreen = ({ navigation }: { navigation: any }) => {
  const [selectedId, setSelectedId] = useState("");
  const { data, loading, error } = useQuery<{ courseAttendanceSummaries: CourseSummaryDto[] }>(
    COURSE_ATTENDANCE_SUMMARIES,
    { fetchPolicy: "network-only" },
  );
  const courses = data?.courseAttendanceSummaries ?? [];
  const current = courses.find((item) => item.course.id === selectedId) ?? courses[0];

  return (
    <Screen>
      <Title subtitle="Porcentajes globales por curso, asignatura y estudiante">Asistencia por curso</Title>
      {error ? (
        <ErrorBox message="No se pudo cargar el resumen de asistencia." />
      ) : loading && courses.length === 0 ? (
        <Loading />
      ) : courses.length === 0 ? (
        <Empty title="No hay cursos registrados" />
      ) : (
        <>
          <View style={styles.wrap}>
            {courses.map((item) => (
              <Button
                key={item.course.id}
                label={item.course.nameCourse}
                size="sm"
                variant={current?.course.id === item.course.id ? "primary" : "outline"}
                onPress={() => setSelectedId(item.course.id)}
              />
            ))}
          </View>
          {current && (
            <>
              <Card>
                <Text style={styles.cardTitle}>{current.course.nameCourse}</Text>
                <Meter percentage={current.percentage} empty={!(current.totalAsist + current.totalAbsences)} />
                <Text style={styles.muted}>
                  {current.students} estudiantes · {current.totalAsist} asistencias · {current.totalAbsences} ausencias
                </Text>
              </Card>
              <SectionTitle>Por asignatura</SectionTitle>
              <Card>
                {current.subjects.map((subject) => (
                  <Pressable
                    key={subject.subject.id}
                    style={styles.summaryRow}
                    onPress={() => navigation.navigate("SubjectDetail", { subjectId: Number(subject.subject.id) })}
                  >
                    <Text style={styles.link}>
                      {subject.subject.name} <Text style={styles.muted}>· {subject.classesHeld} clases</Text>
                    </Text>
                    <Meter percentage={subject.percentage} empty={!(subject.totalAsist + subject.totalAbsences)} />
                  </Pressable>
                ))}
              </Card>
              <SectionTitle>Por estudiante</SectionTitle>
              <Card>
                {[...current.studentsSummary]
                  .sort((a, b) => a.percentage - b.percentage)
                  .map((student) => (
                    <Pressable
                      key={student.user.id}
                      style={styles.summaryRow}
                      onPress={() => navigation.navigate("StudentAttendance", { student: student.user })}
                    >
                      <Row style={styles.between}>
                        <Text style={styles.link}>
                          {student.user.firstName} {student.user.lastName}
                        </Text>
                        {student.percentage < 75 && <Badge label="En riesgo" tone="error" />}
                      </Row>
                      <Meter percentage={student.percentage} />
                    </Pressable>
                  ))}
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
};

interface StudentRow {
  totalAsist: number;
  totalAbsences: number;
  subject: { id: string; name: string; numberOfClasses: number; course: { nameCourse: string } };
}

const percentOf = (present: number, absent: number): number =>
  present + absent ? Math.round((present / (present + absent)) * 1000) / 10 : 0;

export const StudentAttendanceScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const student: { id: string; firstName: string; lastName: string; rut: string } = route.params.student;
  const { data, loading, error } = useQuery<{ attendanceByStudent: StudentRow[] }>(ATTENDANCE_BY_STUDENT, {
    variables: { studentId: Number(student.id) },
    fetchPolicy: "network-only",
  });
  const rows = data?.attendanceByStudent ?? [];
  const present = rows.reduce((sum, row) => sum + row.totalAsist, 0);
  const absent = rows.reduce((sum, row) => sum + row.totalAbsences, 0);

  return (
    <Screen>
      <Title subtitle={`RUT ${student.rut}${rows[0] ? ` · ${rows[0].subject.course.nameCourse}` : ""}`}>
        {`${student.firstName} ${student.lastName}`}
      </Title>
      {error ? (
        <ErrorBox message="No se pudo cargar la asistencia del estudiante." />
      ) : loading && !data ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty title="Sin asignaturas" description="El estudiante aún no está inscrito en ninguna asignatura." />
      ) : (
        <>
          <Card>
            <Text style={styles.label}>Asistencia global</Text>
            <Meter percentage={percentOf(present, absent)} empty={!(present + absent)} />
            <Text style={styles.muted}>
              {rows.length} asignaturas · {present} asistencias · {absent} ausencias
            </Text>
          </Card>
          <SectionTitle>Detalle por asignatura</SectionTitle>
          <Card>
            {rows.map((row) => (
              <Pressable
                key={row.subject.id}
                style={styles.summaryRow}
                onPress={() => navigation.navigate("SubjectDetail", { subjectId: Number(row.subject.id) })}
              >
                <Text style={styles.link}>
                  {row.subject.name} <Text style={styles.muted}>· {row.totalAsist + row.totalAbsences} clases</Text>
                </Text>
                <Meter percentage={percentOf(row.totalAsist, row.totalAbsences)} empty={!(row.totalAsist + row.totalAbsences)} />
                <Text style={styles.muted}>
                  {row.totalAsist} asistencias · {row.totalAbsences} ausencias
                </Text>
              </Pressable>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
};


export const AttendanceCalendarScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const subjectId: number = route.params.subjectId;
  const { data, loading, error } = useQuery<{ subjectAttendanceCalendar: SubjectCalendarDto }>(SUBJECT_ATTENDANCE_CALENDAR, {
    variables: { subjectId },
    fetchPolicy: "network-only",
  });
  const calendar = data?.subjectAttendanceCalendar;

  return (
    <Screen>
      <Title subtitle={calendar ? `${calendar.subject.course.nameCourse} · ${calendar.days.length} días registrados` : undefined}>
        {calendar ? `Calendario · ${calendar.subject.name}` : "Calendario"}
      </Title>
      {error ? (
        <ErrorBox message="No se pudo cargar el calendario de asistencia." />
      ) : loading && !calendar ? (
        <Loading />
      ) : !calendar ? (
        <ErrorBox message="La asignatura no existe o no está disponible." />
      ) : calendar.days.length === 0 ? (
        <Empty title="Aún no hay días registrados" description="El primer día aparecerá cuando registres la asistencia de al menos un estudiante." />
      ) : (
        <>
          <View style={styles.legend}>
            <View style={[styles.legendBox, { backgroundColor: colors.success }]} />
            <Text style={styles.muted}>Presente</Text>
            <View style={[styles.legendBox, { backgroundColor: colors.error }]} />
            <Text style={styles.muted}>Ausente</Text>
            <View style={[styles.legendBox, { backgroundColor: colors.border }]} />
            <Text style={styles.muted}>Sin registro</Text>
          </View>
          <Card>
            <View style={styles.gridRow}>
              <View style={styles.nameColumn}>
                <View style={styles.headerCell} />
                {calendar.students.map((student) => (
                  <Pressable
                    key={student.user.id}
                    style={styles.nameCell}
                    onPress={() => navigation.navigate("StudentAttendance", { student: student.user })}
                  >
                    <Text style={styles.link} numberOfLines={1}>
                      {student.user.firstName} {student.user.lastName}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <View style={styles.dataRow}>
                    {calendar.days.map((day) => {
                      const label = formatDay(day.date);
                      return (
                        <View key={day.date} style={styles.dayHeader}>
                          <Text style={styles.dayWeekday}>{label.weekday}</Text>
                          <Text style={styles.dayNumber}>{label.day}</Text>
                        </View>
                      );
                    })}
                    <View style={styles.totalHeader}>
                      <Text style={styles.dayWeekday}>%</Text>
                    </View>
                  </View>
                  {calendar.students.map((student) => {
                    const marks = new Map(student.marks.map((mark) => [mark.date, mark.present]));
                    return (
                      <View key={student.user.id} style={styles.dataRow}>
                        {calendar.days.map((day) => {
                          const mark = marks.get(day.date);
                          const color = mark === undefined ? colors.border : mark ? colors.success : colors.error;
                          return (
                            <View key={day.date} style={styles.cellWrap}>
                              <View
                                style={[styles.cell, { backgroundColor: color }]}
                                accessibilityLabel={`${student.user.firstName} ${day.date}`}
                              />
                            </View>
                          );
                        })}
                        <View style={styles.totalCell}>
                          <Text style={styles.percentText}>{student.marks.length ? `${Math.round(student.percentage)}%` : "-"}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
};
