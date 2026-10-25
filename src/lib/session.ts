import AsyncStorage from "@react-native-async-storage/async-storage";

export type Role = "admin" | "teacher" | "parents" | "student";

export interface Session {
  token: string;
  id: number;
  role: Role;
  firstName: string;
  isChangePassword: boolean;
}

const KEY = "aulaconecta.session";

export const normalizeRole = (role: string): Role => role.toLowerCase() as Role;

export const loadSession = async (): Promise<Session | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const saveSession = async (session: Session | null): Promise<void> => {
  try {
    if (session) {
      await AsyncStorage.setItem(KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(KEY);
    }
  } catch {
    return;
  }
};

let currentToken: string | null = null;
export const setCurrentToken = (token: string | null) => {
  currentToken = token;
};
export const getCurrentToken = () => currentToken;

export const roleLabel: Record<Role, string> = {
  admin: "Administrador",
  teacher: "Profesor",
  parents: "Apoderado",
  student: "Estudiante",
};
