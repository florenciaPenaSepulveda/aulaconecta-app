import React from "react";
import { StatusBar } from "expo-status-bar";
import { ApolloProvider } from "@apollo/client";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import client from "./src/apollo";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { Loading } from "./src/components/ui";
import { ChangePasswordScreen, ForgotPassScreen, LoginScreen, RegisterScreen } from "./src/screens/auth";
import { ChatScreen, ContactsScreen, NoticesScreen, ProfileScreen } from "./src/screens/common";
import { ChildDetailScreen, ParentHomeScreen } from "./src/screens/parent";
import { AttendanceCalendarScreen, CourseAttendanceScreen, GradesScreen, StudentAttendanceScreen, SubjectDetailScreen, SubjectsScreen } from "./src/screens/staff";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

const stackOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "600" as const },
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tabIcon = (name: IconName, focusedName: IconName) =>
  ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );

const tabOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "600" as const },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
};

const ParentTabs = () => (
  <Tabs.Navigator screenOptions={tabOptions}>
    <Tabs.Screen
      name="Inicio"
      component={ParentHomeScreen}
      options={{ tabBarIcon: tabIcon("home-outline", "home") }}
    />
    <Tabs.Screen
      name="Anuncios"
      component={NoticesScreen}
      options={{ tabBarIcon: tabIcon("megaphone-outline", "megaphone") }}
    />
    <Tabs.Screen
      name="Mensajes"
      component={ContactsScreen}
      options={{ tabBarIcon: tabIcon("chatbubbles-outline", "chatbubbles") }}
    />
    <Tabs.Screen
      name="Perfil"
      component={ProfileScreen}
      options={{ tabBarIcon: tabIcon("person-outline", "person") }}
    />
  </Tabs.Navigator>
);

const StaffTabs = () => (
  <Tabs.Navigator screenOptions={tabOptions}>
    <Tabs.Screen
      name="Asignaturas"
      component={SubjectsScreen}
      options={{ tabBarIcon: tabIcon("book-outline", "book") }}
    />
    <Tabs.Screen
      name="Anuncios"
      component={NoticesScreen}
      options={{ tabBarIcon: tabIcon("megaphone-outline", "megaphone") }}
    />
    <Tabs.Screen
      name="Mensajes"
      component={ContactsScreen}
      options={{ tabBarIcon: tabIcon("chatbubbles-outline", "chatbubbles") }}
    />
    <Tabs.Screen
      name="Perfil"
      component={ProfileScreen}
      options={{ tabBarIcon: tabIcon("person-outline", "person") }}
    />
  </Tabs.Navigator>
);

const Root = () => {
  const { session, ready } = useAuth();

  if (!ready) {
    return <Loading />;
  }

  if (!session) {
    return (
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "AulaConecta" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="ForgotPass" component={ForgotPassScreen} options={{ title: "Recuperar contraseña" }} />
      </Stack.Navigator>
    );
  }

  if (session.isChangePassword) {
    return (
      <Stack.Navigator screenOptions={stackOptions}>
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Cambiar contraseña" }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="Main"
        component={session.role === "parents" ? ParentTabs : StaffTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} options={{ title: "Detalle académico" }} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} options={{ title: "Asignatura" }} />
      <Stack.Screen name="CourseAttendance" component={CourseAttendanceScreen} options={{ title: "Asistencia por curso" }} />
      <Stack.Screen name="StudentAttendance" component={StudentAttendanceScreen} options={{ title: "Asistencia del estudiante" }} />
      <Stack.Screen name="AttendanceCalendar" component={AttendanceCalendarScreen} options={{ title: "Calendario de asistencia" }} />
      <Stack.Screen name="Grades" component={GradesScreen} options={{ title: "Notas" }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => {
          const contact = (route.params as { contact: { firstName: string; lastName: string } }).contact;
          return { title: `${contact.firstName} ${contact.lastName}` };
        }}
      />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Cambiar contraseña" }} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <AuthProvider>
            <NavigationContainer theme={theme}>
              <StatusBar style="light" />
              <Root />
            </NavigationContainer>
          </AuthProvider>
        </ApolloProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
