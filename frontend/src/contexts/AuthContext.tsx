import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "ADMIN" | "INSTITUTION";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
  isTemporaryPassword: boolean;
}

interface AuthSession {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (loginInput: string, password: string) => Promise<AuthUser>;
  changeTemporaryPassword: (newPassword: string) => Promise<AuthUser>;
  logout: () => void;
}

const STORAGE_KEY = "acessa_auth_session";

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed?.user?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readStoredSession()
  );

  const saveSession = (next: AuthSession | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (
    loginInput: string,
    password: string
  ): Promise<AuthUser> => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginInput, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Não foi possível fazer login.");
    }

    const nextSession: AuthSession = {
      token: data.token,
      user: data.user,
    };
    saveSession(nextSession);
    return data.user;
  };

  const changeTemporaryPassword = async (
    newPassword: string
  ): Promise<AuthUser> => {
    if (!session?.token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const response = await fetch("/api/auth/change-temporary-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data.message || "Não foi possível atualizar a senha."
      );
    }

    const nextSession: AuthSession = {
      token: data.token,
      user: data.user,
    };
    saveSession(nextSession);
    return data.user;
  };

  const logout = () => {
    saveSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token: session?.token ?? null,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.token),
        isAdmin: session?.user?.role === "ADMIN",
        login,
        changeTemporaryPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return ctx;
}
