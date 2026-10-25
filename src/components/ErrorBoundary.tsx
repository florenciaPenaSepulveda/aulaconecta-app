import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./ui";
import { colors } from "../theme";

interface Props {
  children: React.ReactNode;
  onReload?: () => void;
}

interface State {
  failed: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info.componentStack);
  }

  private reload = () => {
    this.setState({ failed: false });
    this.props.onReload?.();
  };

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    return (
      <View style={styles.container} accessibilityRole="alert">
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.text}>Ocurrió un error inesperado. Vuelve a intentarlo; si el problema persiste, avisa al colegio.</Text>
        <Button label="Reintentar" onPress={this.reload} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "600", color: colors.primary, textAlign: "center" },
  text: { fontSize: 14, color: colors.muted, textAlign: "center" },
});

export default ErrorBoundary;
