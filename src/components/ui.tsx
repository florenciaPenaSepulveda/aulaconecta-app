import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { colors, font, radius, spacing } from "../theme";

export const Screen = ({
  children,
  scroll = true,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) => {
  const content = padded ? styles.screenPadding : undefined;
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll ? (
        <ScrollView contentContainerStyle={[content, styles.scrollGrow]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screen, content]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
};

export const Title = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
  <View style={styles.titleBlock}>
    <Text style={styles.title}>{children}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.section}>{children}</Text>
);

export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.card, style]}>{children}</View>
);

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = ({ label, onPress, variant = "primary", size = "md", loading, disabled, style }: ButtonProps) => {
  const isDisabled = disabled || loading;
  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryContent, border: colors.primary },
    outline: { bg: "transparent", fg: colors.primary, border: colors.primary },
    ghost: { bg: "transparent", fg: colors.secondary, border: "transparent" },
    danger: { bg: "transparent", fg: colors.error, border: "transparent" },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        size === "sm" && styles.buttonSm,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.buttonText, size === "sm" && styles.buttonTextSm, { color: palette.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
};

interface FieldProps extends TextInputProps {
  label: string;
}

export const Field = ({ label, style, ...props }: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      accessibilityLabel={label}
      {...props}
      style={[styles.input, props.multiline && styles.inputMultiline, style]}
    />
  </View>
);

export const Badge = ({ label, tone = "neutral" }: { label: string; tone?: "success" | "error" | "neutral" }) => {
  const bg = tone === "success" ? "#e3f1ea" : tone === "error" ? "#f6e4e4" : "#e8edf3";
  const fg = tone === "success" ? colors.success : tone === "error" ? colors.error : colors.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
};

export const attendanceColor = (percentage: number): string =>
  percentage >= 85 ? colors.success : percentage >= 75 ? colors.warning : colors.error;

export const formatPercentage = (percentage: number): string =>
  `${percentage.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;

export const Meter = ({ percentage, empty = false }: { percentage: number; empty?: boolean }) => (
  <View style={styles.meterRow}>
    <View style={styles.meterTrack}>
      <View
        style={[
          styles.meterFill,
          { width: `${empty ? 0 : Math.min(100, percentage)}%`, backgroundColor: attendanceColor(percentage) },
        ]}
      />
    </View>
    <Text style={styles.meterText}>{empty ? "Sin registros" : formatPercentage(percentage)}</Text>
  </View>
);

export const Loading = () => (
  <View style={styles.center}>
    <ActivityIndicator color={colors.primary} />
  </View>
);

export const Empty = ({ title, description }: { title: string; description?: string }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {description ? <Text style={styles.emptyText}>{description}</Text> : null}
  </View>
);

export const ErrorBox = ({ message }: { message: string }) => (
  <View style={styles.errorBox}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

export const Avatar = ({ text }: { text: string }) => (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>{text}</Text>
  </View>
);

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.row, style]}>{children}</View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenPadding: { padding: spacing.lg, gap: spacing.md },
  scrollGrow: { flexGrow: 1 },
  titleBlock: { marginBottom: spacing.sm },
  title: { fontSize: font.title, fontWeight: "600", color: colors.primary },
  subtitle: { fontSize: font.subtitle, color: colors.muted, marginTop: 2 },
  section: { fontSize: font.section, fontWeight: "600", color: colors.neutral },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    minHeight: 46,
    borderRadius: radius,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonSm: { minHeight: 36, paddingHorizontal: spacing.md },
  buttonText: { fontSize: font.button, fontWeight: "600" },
  buttonTextSm: { fontSize: font.body },
  field: { gap: 6 },
  label: { fontSize: font.body, fontWeight: "500", color: colors.neutral },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: font.body,
    color: colors.text,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top", paddingTop: spacing.md },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: font.small, fontWeight: "600" },
  center: { padding: spacing.xl, alignItems: "center" },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius,
    padding: spacing.xl,
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
  },
  emptyTitle: { fontSize: font.section, fontWeight: "600", color: colors.neutral, textAlign: "center" },
  emptyText: { fontSize: font.body, color: colors.muted, textAlign: "center" },
  errorBox: { backgroundColor: "#f6e4e4", borderRadius: radius, padding: spacing.md },
  errorText: { color: colors.error, fontSize: font.body },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryContent, fontWeight: "600", fontSize: font.body },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  meterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  meterTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
  meterFill: { height: 8, borderRadius: 4 },
  meterText: { minWidth: 56, fontSize: font.small, fontWeight: "600", color: colors.neutral, textAlign: "right" },
});
