import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Field, Loading, Row, Screen, SectionTitle, Title } from "../components/ui";
import {
  CHAT_CONTACTS,
  CONVERSATION,
  CREATE_NOTICE,
  DELETE_NOTICE,
  GET_ALL_NOTICES,
  MessageDto,
  NoticeDto,
  SEND_MESSAGE,
} from "../graphql";
import { confirmAction, errorMessage, notify } from "../lib/alerts";
import { formatDate, formatTime, initials } from "../lib/format";
import { roleLabel } from "../lib/session";
import { colors, font, radius, spacing } from "../theme";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const contactRole: Record<string, string> = {
  Teacher: "Profesor",
  Parents: "Apoderado",
  Admin: "Administrador",
};

export const NoticesScreen = () => {
  const { session } = useAuth();
  const canPublish = session?.role === "teacher" || session?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "" });
  const { data, loading, error, refetch } = useQuery<{ getAllNotices: NoticeDto[] }>(GET_ALL_NOTICES);
  const [createNotice, createState] = useMutation(CREATE_NOTICE, { refetchQueries: [GET_ALL_NOTICES] });
  const [deleteNotice] = useMutation(DELETE_NOTICE, { refetchQueries: [GET_ALL_NOTICES] });
  const notices = data?.getAllNotices ?? [];

  const handlePublish = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      notify("Revisa los datos", "Completa el título y el mensaje.");
      return;
    }
    try {
      const { data: result } = await createNotice({
        variables: {
          title: form.title.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim() || null,
        },
      });
      if (!result?.createNotice?.isCreateNotice) {
        throw new Error("No se pudo publicar el anuncio");
      }
      setForm({ title: "", description: "", imageUrl: "" });
      setShowForm(false);
    } catch (err) {
      notify("No se pudo publicar", errorMessage(err));
    }
  };

  const handleDelete = async (notice: NoticeDto) => {
    if (!(await confirmAction("Eliminar anuncio", `Se eliminará "${notice.title}".`, "Eliminar"))) {
      return;
    }
    try {
      await deleteNotice({ variables: { id: Number(notice.id) } });
    } catch (err) {
      notify("No se pudo eliminar", errorMessage(err));
    }
  };

  return (
    <Screen>
      <Title subtitle={canPublish ? "Publica comunicados para la comunidad" : "Comunicados del colegio"}>Anuncios</Title>
      {canPublish && (
        <Button
          label={showForm ? "Cancelar" : "Nuevo anuncio"}
          variant={showForm ? "outline" : "primary"}
          onPress={() => setShowForm(!showForm)}
        />
      )}
      {showForm && (
        <Card>
          <Field label="Título" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} autoCapitalize="sentences" />
          <Field
            label="Mensaje"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
            autoCapitalize="sentences"
          />
          <Field
            label="URL de imagen (opcional)"
            value={form.imageUrl}
            onChangeText={(v) => setForm({ ...form, imageUrl: v })}
            keyboardType="url"
          />
          <Button label="Publicar" onPress={handlePublish} loading={createState.loading} />
        </Card>
      )}
      {error ? (
        <ErrorBox message="No se pudieron cargar los anuncios." />
      ) : loading && !data ? (
        <Loading />
      ) : notices.length === 0 ? (
        <Empty title="No hay anuncios publicados" description="Cuando se publique un comunicado aparecerá aquí." />
      ) : (
        notices.map((notice) => (
          <Card key={notice.id}>
            <Text style={styles.cardTitle}>{notice.title}</Text>
            <Text style={styles.muted}>{formatDate(notice.createdAt)}</Text>
            <Text style={styles.body}>{notice.description}</Text>
            {canPublish && <Button label="Eliminar" variant="danger" size="sm" onPress={() => handleDelete(notice)} />}
          </Card>
        ))
      )}
      <Button label="Actualizar" variant="ghost" size="sm" onPress={() => refetch()} />
    </Screen>
  );
};

export const ContactsScreen = ({ navigation }: { navigation: any }) => {
  const { session } = useAuth();
  const { data, loading, error, refetch } = useQuery<{ chatContacts: Contact[] }>(CHAT_CONTACTS);
  const contacts = data?.chatContacts ?? [];

  return (
    <Screen>
      <Title
        subtitle={
          session?.role === "parents"
            ? "Conversa con los profesores de tus pupilos"
            : "Conversa con los apoderados de tus estudiantes"
        }
      >
        Mensajes
      </Title>
      {error ? (
        <ErrorBox message="No se pudieron cargar tus contactos." />
      ) : loading && !data ? (
        <Loading />
      ) : contacts.length === 0 ? (
        <Empty
          title="Aún no tienes contactos"
          description="Aparecerán cuando existan estudiantes inscritos en asignaturas asociadas a ti."
        />
      ) : (
        contacts.map((contact) => (
          <Card key={contact.id}>
            <Row>
              <Avatar text={initials(contact.firstName, contact.lastName)} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>
                  {contact.firstName} {contact.lastName}
                </Text>
                <Text style={styles.muted}>{contactRole[contact.role] ?? contact.role}</Text>
              </View>
              <Button label="Abrir chat" size="sm" onPress={() => navigation.navigate("Chat", { contact })} />
            </Row>
          </Card>
        ))
      )}
      <Button label="Actualizar" variant="ghost" size="sm" onPress={() => refetch()} />
    </Screen>
  );
};

export const ChatScreen = ({ route }: { route: any }) => {
  const { session } = useAuth();
  const contact: Contact = route.params.contact;
  const withId = Number(contact.id);
  const listRef = useRef<FlatList<MessageDto>>(null);
  const [text, setText] = useState("");

  const { data, loading } = useQuery<{ conversation: MessageDto[] }>(CONVERSATION, {
    variables: { withId },
    pollInterval: 4000,
    fetchPolicy: "network-only",
  });
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: CONVERSATION, variables: { withId } }],
    awaitRefetchQueries: true,
  });
  const messages = data?.conversation ?? [];

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) {
      return;
    }
    try {
      await sendMessage({ variables: { toId: withId, content } });
      setText("");
    } catch (error) {
      notify("No se pudo enviar", errorMessage(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.chat}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {loading && messages.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={<Empty title="Aún no hay mensajes" description="Escribe el primero." />}
          renderItem={({ item }) => {
            const mine = item.fromId === session?.id;
            return (
              <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirsWrap]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.content}</Text>
                </View>
                <Text style={styles.time}>
                  {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                </Text>
              </View>
            );
          }}
        />
      )}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Escribe un mensaje"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
        />
        <Button label="Enviar" size="sm" onPress={handleSend} loading={sending} disabled={!text.trim()} />
      </View>
    </KeyboardAvoidingView>
  );
};

export const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const { session, signOut } = useAuth();
  if (!session) {
    return null;
  }

  return (
    <Screen>
      <Title subtitle="Tu cuenta en AulaConecta">Perfil</Title>
      <Card>
        <Row>
          <Avatar text={initials(session.firstName)} />
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{session.firstName}</Text>
            <Badge label={roleLabel[session.role]} />
          </View>
        </Row>
      </Card>
      <SectionTitle>Seguridad</SectionTitle>
      <Button label="Cambiar contraseña" variant="outline" onPress={() => navigation.navigate("ChangePassword")} />
      <Button label="Cerrar sesión" variant="danger" onPress={signOut} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardTitle: { fontSize: font.section, fontWeight: "600", color: colors.neutral },
  muted: { fontSize: font.small, color: colors.muted },
  body: { fontSize: font.body, color: colors.text },
  chat: { flex: 1, backgroundColor: colors.background },
  chatList: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  bubbleWrap: { maxWidth: "82%", gap: 2 },
  mineWrap: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirsWrap: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: radius * 1.5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  mine: { backgroundColor: colors.primary },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: font.body, color: colors.text },
  mineText: { color: "#ffffff" },
  time: { fontSize: 11, color: colors.muted },
  composer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
    color: colors.text,
  },
});
