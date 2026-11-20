"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";
import { bootstrapUser } from "@/lib/db";

type Ctx = { user: User | null; loading: boolean; logout: () => Promise<void> };
const AuthContext = createContext<Ctx>({ user: null, loading: true, logout: async () => {} });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires on load with the saved session (or null), then on every login/logout.
    try {
      return onAuthStateChanged(getFirebaseAuth(), (u) => {
        setUser(u);
        setLoading(false);
        if (u) bootstrapUser(u.uid).catch((e) => console.error("bootstrap:", e));
      });
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

/**
 * Wrap any page that needs a signed-in user.
 * The page is always rendered (hidden until the session is confirmed), so Next.js can
 * validate the route. Signed-out visitors are sent to /auth.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const ready = !loading && !!user;

  useEffect(() => { if (!loading && !user) router.replace("/auth"); }, [loading, user, router]);

  return (
    <>
      {!ready && (
        <main className="grid min-h-screen place-items-center" role="status" aria-label="Checking your session">
          <Loader2 className="animate-spin text-violet" />
        </main>
      )}
      <div hidden={!ready}>{children}</div>
    </>
  );
}