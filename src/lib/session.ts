import { storage } from "./storage";

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
    const raw = await storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const saveSession = async (session: Session | null): Promise<void> => {
  try {
    if (session) {
      await storage.setItem(KEY, JSON.stringify(session));
    } else {
      await storage.removeItem(KEY);
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

const expiredListeners = new Set<() => void>();
export const onSessionExpired = (listener: () => void): (() => void) => {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
};
export const notifySessionExpired = (): void => expiredListeners.forEach((listener) => listener());

export const roleLabel: Record<Role, string> = {
  admin: "Administrador",
  teacher: "Profesor",
  parents: "Apoderado",
  student: "Estudiante",
};
