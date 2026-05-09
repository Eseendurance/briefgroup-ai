"use client";

import {
  User,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "@/app/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout: () => signOut(auth),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }

    if (!loading && user && adminOnly && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [adminOnly, isAdmin, loading, router, user]);

  if (loading || !user || (adminOnly && !isAdmin)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07110f] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
      </main>
    );
  }

  return children;
}
