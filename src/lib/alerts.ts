import { Alert, Platform } from "react-native";

export const notify = (title: string, message?: string): void => {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};

export const confirmAction = (title: string, message: string, confirmText = "Confirmar"): Promise<boolean> => {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: confirmText, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
};

export const errorMessage = (error: unknown, fallback = "Ocurrió un error inesperado"): string => {
  const message =
    (error as { graphQLErrors?: { message: string }[] })?.graphQLErrors?.[0]?.message ??
    (error as { message?: string })?.message;
  if (!message || message === "Bad Request Exception" || /network request failed/i.test(message)) {
    return /network request failed/i.test(message ?? "")
      ? "No se pudo conectar con el servidor. Verifica que el backend esté activo."
      : fallback;
  }
  if (/Too Many Requests/i.test(message)) {
    return "Demasiados intentos. Espera un minuto e inténtalo de nuevo.";
  }
  return message;
};
