"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";

type Ctx = { user: User | null; loading: boolean; logout: () => Promise<void> };
const AuthContext = createContext<Ctx>({ user: null, loading: true, logout: async () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires on load with the saved session (or null), then on every login/logout.
    try {
      return onAuthStateChanged(getFirebaseAuth(), (u) => { setUser(u); setLoading(false); });
    } catch (err) {
      console.error(err); // usually missing .env.local values
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    await signOut(getFirebaseAuth());
    try {
      ["mindbank:draft", "mindbank:assessment"].forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  };

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}

/** Wrap any page that needs a signed-in user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && !user) router.replace("/auth"); }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center" role="status" aria-label="Checking your session">
        <Loader2 className="animate-spin text-violet" />
      </main>
    );
  }
  return <>{children}</>;
}