import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken as persistToken } from "./api";

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  created_at?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = getToken();
    setTokenState(t);
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      persistToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ access_token: string }>("/auth/login", {
        body: { email, password },
      });
      persistToken(res.access_token);
      setTokenState(res.access_token);
      const me = await api<User>("/auth/me");
      setUser(me);
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, full_name?: string) => {
      const res = await api<{ access_token: string }>("/auth/register", {
        body: { email, password, full_name },
      });
      persistToken(res.access_token);
      setTokenState(res.access_token);
      const me = await api<User>("/auth/me");
      setUser(me);
    },
    [],
  );

  const logout = useCallback(() => {
    persistToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, refresh }),
    [user, token, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}