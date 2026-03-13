"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  /** Convenience: true when user has admin or super_admin role */
  canWrite: boolean;
  /** Convenience: true when user has super_admin role */
  isSuperAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  loading: true,
  canWrite: false,
  isSuperAdmin: false,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser({
            id: data.user.id ?? data.user._id,
            firstName: data.user.firstName ?? "",
            lastName: data.user.lastName ?? "",
            email: data.user.email ?? "",
            role: data.user.role ?? "user",
            avatar: data.user.avatar,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canWrite = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AdminAuthContext.Provider
      value={{ user, loading, canWrite, isSuperAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
