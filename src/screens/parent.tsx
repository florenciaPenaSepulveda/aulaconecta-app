import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Loading, Row, Screen, SectionTitle, Title } from "../components/ui";
import {
  ATTENDANCE_BY_STUDENT,
  GET_ALL_NOTICES,
  GRADES_BY_STUDENT,
  GradeDto,
  MY_CHILDREN,
  NoticeDto,
  UserDto,
} from "../graphql";
import { average, formatDate, formatGrade, initials } from "../lib/format";
import { colors, font, spacing } from "../theme";

const tone = (value: number): "success" | "error" | "neutral" => (!value ? "neutral" : value >= 4 ? "success" : "error");

const ChildSummary = ({ child, onOpen }: { child: UserDto; onOpen: () => void }) => {
  const studentId = Number(child.id);
  const grades = useQuery<{ gradesByStudentId: GradeDto[] }>(GRADES_BY_STUDENT, { variables: { studentId } });
  const attendance = useQuery<{ attendanceByStudent: { totalAsist: number; totalAbsences: number }[] }>(
    ATTENDANCE_BY_STUDENT,
    { variables: { studentId } },
  );
  const avg = average((grades.data?.gradesByStudentId ?? []).map((g) => g.grade));
  const records = attendance.data?.attendanceByStudent ?? [];
  const present = records.reduce((sum, r) => sum + r.totalAsist, 0);
  const total = present + records.reduce((sum, r) => sum + r.totalAbsences, 0);
  const pct = total ? Math.round((present / total) * 100) : null;

  return (
    <Card>
      <Row>
        <Avatar text={initials(child.firstName, child.lastName)} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>
            {child.firstName} {child.lastName}
          </Text>
          <Text style={styles.muted}>{child.rut}</Text>
        </View>
      </Row>
      <Row style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.muted}>Promedio general</Text>
          <Badge label={formatGrade(avg)} tone={tone(avg)} />
        </View>
        <View style={styles.stat}>
          <Text style={styles.muted}>Asistencia</Text>
          <Text style={styles.statValue}>{pct === null ? "-" : `${pct}%`}</Text>
        </View>
      </Row>
      <Button label="Ver detalle académico" size="sm" onPress={onOpen} />
    </Card>
  );
};

export const ParentHomeScreen = ({ navigation }: { navigation: any }) => {
  const { session } = useAuth();
  const children = useQuery<{ myChildren: UserDto[] }>(MY_CHILDREN);
  const notices = useQuery<{ getAllNotices: NoticeDto[] }>(GET_ALL_NOTICES);
  const list = children.data?.myChildren ?? [];
  const latest = (notices.data?.getAllNotices ?? []).slice(0, 2);

  return (
    <Screen>
      <Title subtitle="Resumen académico de tus pupilos">{`Hola, ${session?.firstName ?? ""}`}</Title>
      <SectionTitle>Mis pupilos</SectionTitle>
      {children.error ? (
        <ErrorBox message="No se pudo cargar la información de tus pupilos." />
      ) : children.loading && !children.data ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty
          title="No tienes pupilos asociados"
          description="Solicita al colegio que asocie a tu pupilo con tu RUT de apoderado."
        />
      ) : (
        list.map((child) => (
          <ChildSummary
            key={child.id}
            child={child}
            onOpen={() => navigation.navigate("ChildDetail", { child })}
          />
        ))
      )}
      <SectionTitle>Anuncios recientes</SectionTitle>
      {latest.length === 0 ? (
        <Text style={styles.muted}>No hay anuncios publicados.</Text>
      ) : (
        latest.map((notice) => (
          <Card key={notice.id}>
            <Text style={styles.cardTitle}>{notice.title}</Text>
            <Text style={styles.muted}>{formatDate(notice.createdAt)}</Text>
            <Text style={styles.body} numberOfLines={3}>
              {notice.description}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
};

interface AttendanceRow {
  totalAsist: number;
  totalAbsences: number;
  subject: { id: string; name: string; numberOfClasses: number; course: { nameCourse: string } };
}

export const ChildDetailScreen = ({ route }: { route: any }) => {
  const child: UserDto = route.params.child;
  const studentId = Number(child.id);
  const grades = useQuery<{ gradesByStudentId: GradeDto[] }>(GRADES_BY_STUDENT, { variables: { studentId } });
  const attendance = useQuery<{ attendanceByStudent: AttendanceRow[] }>(ATTENDANCE_BY_STUDENT, {
    variables: { studentId },
  });
  const gradeList = grades.data?.gradesByStudentId ?? [];
  const rows = attendance.data?.attendanceByStudent ?? [];
  const overall = average(gradeList.map((g) => g.grade));

  return (
    <Screen>
      <Title subtitle={`RUT ${child.rut}`}>{`${child.firstName} ${child.lastName}`}</Title>
      <Card>
        <Text style={styles.muted}>Promedio general</Text>
        <Badge label={formatGrade(overall)} tone={tone(overall)} />
      </Card>
      <SectionTitle>Detalle por asignatura</SectionTitle>
      {attendance.error || grades.error ? (
        <ErrorBox message="No se pudo cargar la información del estudiante." />
      ) : attendance.loading && !attendance.data ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty title="Sin asignaturas" description="El estudiante aún no está inscrito en ninguna asignatura." />
      ) : (
        rows.map((row) => {
          const list = gradeList.filter((g) => String(g.subjectId) === String(row.subject.id));
          const avg = average(list.map((g) => g.grade));
          const held = row.totalAsist + row.totalAbsences;
          const pct = held ? Math.round((row.totalAsist / held) * 100) : null;
          return (
            <Card key={row.subject.id}>
              <Row style={styles.between}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{row.subject.name}</Text>
                  <Text style={styles.muted}>{row.subject.course.nameCourse}</Text>
                </View>
                <Badge label={`Prom. ${formatGrade(avg)}`} tone={tone(avg)} />
              </Row>
              <View style={styles.wrap}>
                {list.length === 0 ? (
                  <Text style={styles.muted}>Sin notas</Text>
                ) : (
                  list.map((g) => <Badge key={g.id} label={formatGrade(Number(g.grade))} tone={tone(Number(g.grade))} />)
                )}
              </View>
              <Text style={styles.body}>
                Asistencia: {pct === null ? "sin registros" : `${pct}% (${row.totalAbsences} ausencias)`}
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardTitle: { fontSize: font.section, fontWeight: "600", color: colors.neutral },
  muted: { fontSize: font.small, color: colors.muted },
  body: { fontSize: font.body, color: colors.text },
  stats: { gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: spacing.md, gap: 6 },
  statValue: { fontSize: font.section, fontWeight: "600", color: colors.neutral },
  between: { justifyContent: "space-between" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
