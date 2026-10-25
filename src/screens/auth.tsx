import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@apollo/client";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, Field, Screen } from "../components/ui";
import { CHANGE_PASSWORD, FORGOT_PASS, LOGIN, REGISTER } from "../graphql";
import { passwordError } from "../lib/password";
import { errorMessage, notify } from "../lib/alerts";
import { formatRut, isValidRut } from "../lib/rut";
import { normalizeRole } from "../lib/session";
import { colors, font, spacing } from "../theme";

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.header}>
    <Text style={styles.brand}>AulaConecta</Text>
    <Text style={styles.headerTitle}>{title}</Text>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
  </View>
);

const LinkText = ({ text, onPress }: { text: string; onPress: () => void }) => (
  <Pressable onPress={onPress} hitSlop={8}>
    <Text style={styles.link}>{text}</Text>
  </Pressable>
);

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { loading }] = useMutation(LOGIN);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      notify("Revisa los datos", "Ingresa tu correo y tu contraseña.");
      return;
    }
    try {
      const { data } = await login({ variables: { email: email.trim(), password } });
      const result = data?.login;
      if (!result?.token) {
        throw new Error("Respuesta inválida");
      }
      await signIn({
        token: result.token,
        id: Number(result.id),
        role: normalizeRole(result.role),
        firstName: result.firstName,
        isChangePassword: Boolean(result.isChangePassword),
      });
    } catch (error) {
      const message = errorMessage(error, "El correo o la contraseña no son correctos.");
      notify("No se pudo iniciar sesión", message);
    }
  };

  return (
    <Screen>
      <Header title="Iniciar sesión" subtitle="Ingresa con tu cuenta institucional" />
      <Card>
        <Field
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="nombre@colegio.cl"
        />
        <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Tu contraseña" />
        <LinkText text="¿Olvidaste tu contraseña?" onPress={() => navigation.navigate("ForgotPass")} />
        <Button label="Iniciar sesión" onPress={handleSubmit} loading={loading} />
      </Card>
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
        <LinkText text="Regístrate" onPress={() => navigation.navigate("Register")} />
      </View>
    </Screen>
  );
};

export const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    email: "",
    role: "teacher",
    password: "",
    confirm: "",
  });
  const [register, { loading }] = useMutation(REGISTER);
  const set = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      notify("Revisa los datos", "Completa todos los campos.");
      return;
    }
    if (!isValidRut(form.rut)) {
      notify("Revisa los datos", "El RUT ingresado no es válido.");
      return;
    }
    const problema = passwordError(form.password);
    if (problema) {
      notify("Revisa los datos", problema);
      return;
    }
    if (form.password !== form.confirm) {
      notify("Revisa los datos", "Las contraseñas no coinciden.");
      return;
    }
    try {
      await register({
        variables: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          rut: form.rut,
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
      });
      notify("Cuenta creada", "Ya puedes iniciar sesión.");
      navigation.navigate("Login");
    } catch (error) {
      notify("No se pudo crear la cuenta", errorMessage(error));
    }
  };

  return (
    <Screen>
      <Header title="Crear cuenta" subtitle="Registro para profesores y apoderados" />
      <Card>
        <Field label="Nombre" value={form.firstName} onChangeText={(v) => set("firstName", v)} autoCapitalize="words" />
        <Field label="Apellido" value={form.lastName} onChangeText={(v) => set("lastName", v)} autoCapitalize="words" />
        <Field
          label="RUT"
          value={form.rut}
          onChangeText={(v) => set("rut", formatRut(v))}
          placeholder="12.345.678-5"
        />
        <Field label="Correo electrónico" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" />
        <View style={styles.roleRow}>
          <Button
            label="Profesor"
            size="sm"
            variant={form.role === "teacher" ? "primary" : "outline"}
            onPress={() => set("role", "teacher")}
            style={styles.flex}
          />
          <Button
            label="Apoderado"
            size="sm"
            variant={form.role === "parents" ? "primary" : "outline"}
            onPress={() => set("role", "parents")}
            style={styles.flex}
          />
        </View>
        <Field label="Contraseña" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
        <Field label="Repetir contraseña" value={form.confirm} onChangeText={(v) => set("confirm", v)} secureTextEntry />
        <Button label="Crear cuenta" onPress={handleSubmit} loading={loading} />
      </Card>
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
        <LinkText text="Inicia sesión" onPress={() => navigation.navigate("Login")} />
      </View>
    </Screen>
  );
};

export const ForgotPassScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [forgotPass, { loading }] = useMutation(FORGOT_PASS);

  const handleSubmit = async () => {
    if (!email.trim()) {
      notify("Revisa los datos", "Ingresa tu correo electrónico.");
      return;
    }
    try {
      await forgotPass({ variables: { email: email.trim() } });
      notify("Revisa tu correo", "Si el correo está registrado, te enviamos una contraseña temporal para ingresar.");
      navigation.navigate("Login");
    } catch (error) {
      notify("No se pudo enviar el correo", errorMessage(error));
    }
  };

  return (
    <Screen>
      <Header title="Recuperar contraseña" subtitle="Te enviaremos una contraseña temporal a tu correo" />
      <Card>
        <Field label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Button label="Enviar contraseña temporal" onPress={handleSubmit} loading={loading} />
      </Card>
      <View style={styles.footer}>
        <LinkText text="Volver a iniciar sesión" onPress={() => navigation.navigate("Login")} />
      </View>
    </Screen>
  );
};

export const ChangePasswordScreen = () => {
  const { session, markPasswordChanged, signOut } = useAuth();
  const navigation = useNavigation();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD);

  const handleSubmit = async () => {
    if (!current) {
      notify("Revisa los datos", "Ingresa tu contraseña actual.");
      return;
    }
    const problema = passwordError(password);
    if (problema) {
      notify("Revisa los datos", problema);
      return;
    }
    if (password === current) {
      notify("Revisa los datos", "La nueva contraseña debe ser distinta de la actual.");
      return;
    }
    if (password !== confirm) {
      notify("Revisa los datos", "Las contraseñas no coinciden.");
      return;
    }
    try {
      const { data } = await changePassword({ variables: { currentPassword: current, newPassword: password } });
      notify("Contraseña actualizada");
      await markPasswordChanged(data?.changePassword?.token);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      notify("No se pudo cambiar la contraseña", errorMessage(error));
    }
  };

  return (
    <Screen>
      <Header
        title="Cambiar contraseña"
        subtitle={
          session?.isChangePassword
            ? "Por seguridad debes definir una nueva contraseña antes de continuar."
            : "Define una nueva contraseña para tu cuenta."
        }
      />
      <Card>
        <Field label={session?.isChangePassword ? "Contraseña temporal" : "Contraseña actual"} value={current} onChangeText={setCurrent} secureTextEntry />
        <Field label="Nueva contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <Field label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry />
        <Button label="Guardar contraseña" onPress={handleSubmit} loading={loading} />
        <Button label="Cerrar sesión" variant="ghost" onPress={signOut} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.xl, gap: 4 },
  brand: { color: "#ffffff", opacity: 0.8, fontSize: font.body, fontWeight: "600" },
  headerTitle: { color: "#ffffff", fontSize: 22, fontWeight: "600" },
  headerSubtitle: { color: "#ffffff", opacity: 0.85, fontSize: font.body },
  link: { color: colors.secondary, fontSize: font.body, fontWeight: "500" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: spacing.sm },
  footerText: { color: colors.muted, fontSize: font.body },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});
