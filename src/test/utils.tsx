import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { View } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { DocumentNode } from "graphql";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { Role, Session } from "../lib/session";
import { confirmAction } from "../lib/alerts";

export const makeSession = (role: Role, overrides: Partial<Session> = {}): Session => ({
  token: "token",
  id: 1,
  role,
  firstName: "Carlos",
  isChangePassword: false,
  ...overrides,
});

export const ok = (
  query: DocumentNode,
  variables: Record<string, unknown> | undefined,
  data: Record<string, unknown>,
): MockedResponse => ({
  request: { query, variables },
  result: { data },
  maxUsageCount: 20,
});

export const fail = (
  query: DocumentNode,
  variables: Record<string, unknown> | undefined,
  message = "Error de prueba",
): MockedResponse => ({
  request: { query, variables },
  error: new Error(message),
  maxUsageCount: 20,
});

export const makeNavigation = () => ({ navigate: jest.fn(), goBack: jest.fn(), canGoBack: jest.fn(() => true) });

export const prepare = async (session: Session | null) => {
  await AsyncStorage.clear();
  if (session) {
    await AsyncStorage.setItem("aulaconecta.session", JSON.stringify(session));
  }
  (confirmAction as jest.Mock).mockResolvedValue(true);
};

const Gate = ({ children }: { children: React.ReactNode }) => {
  const { ready } = useAuth();
  return ready ? <View testID="auth-ready">{children}</View> : null;
};

interface Options {
  session?: Session | null;
  mocks?: MockedResponse[];
  withNavigation?: boolean;
}

export const renderScreen = async (ui: React.ReactElement, { session = null, mocks = [], withNavigation = false }: Options = {}) => {
  await prepare(session);
  const content = withNavigation ? <NavigationContainer>{ui}</NavigationContainer> : ui;
  const result = render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AuthProvider>
        <Gate>{content}</Gate>
      </AuthProvider>
    </MockedProvider>,
  );
  await waitFor(() => expect(screen.queryByTestId("auth-ready")).toBeTruthy());
  return result;
};
