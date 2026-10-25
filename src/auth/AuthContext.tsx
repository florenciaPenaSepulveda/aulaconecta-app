import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { notify } from "../lib/alerts";
import { Session, loadSession, onSessionExpired, saveSession, setCurrentToken } from "../lib/session";

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  signIn: (session: Session) => Promise<void>;
  markPasswordChanged: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const client = useApolloClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSession().then((stored) => {
      setCurrentToken(stored?.token ?? null);
      setSession(stored);
      setReady(true);
    });
  }, []);

  const signIn = useCallback(async (next: Session) => {
    setCurrentToken(next.token);
    await saveSession(next);
    setSession(next);
  }, []);

  const markPasswordChanged = useCallback(async () => {
    if (!session) {
      return;
    }
    const next = { ...session, isChangePassword: false };
    await saveSession(next);
    setSession(next);
  }, [session]);

  const signOut = useCallback(async () => {
    setCurrentToken(null);
    await saveSession(null);
    setSession(null);
    await client.clearStore();
  }, [client]);

  useEffect(
    () =>
      onSessionExpired(() => {
        notify("Tu sesión expiró", "Inicia sesión nuevamente para continuar.");
        void signOut();
      }),
    [signOut],
  );

  const value = useMemo(
    () => ({ session, ready, signIn, markPasswordChanged, signOut }),
    [session, ready, signIn, markPasswordChanged, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
