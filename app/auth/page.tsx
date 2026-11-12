"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Brain, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";

type Mode = "login" | "signup";
type Draft = { amount: string; goal: string };

const SIDE_IMG =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80";

const friendly = (code?: string) => {
  switch (code) {
    case "auth/email-already-in-use": return "That email already has an account. Try logging in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Email or password is incorrect.";
    case "auth/weak-password": return "Use a stronger password (8+ characters).";
    case "auth/too-many-requests": return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed": return "Network problem. Check your connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "";
    default: return "We couldn’t sign you in. Please try again.";
  }
};

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imgOk, setImgOk] = useState(true);

  const goNext = (m: Mode) => {
    let hasAssessment = false;
    try { hasAssessment = !!localStorage.getItem("mindbank:assessmentMeta"); } catch {}
    router.replace(m === "login" && hasAssessment ? "/dashboard" : "/assessment");
  };

  // Already signed in (saved session)? Skip the form.
  useEffect(() => { if (!authLoading && user && !loading) goNext("login"); }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick up the amount and goal the visitor typed on the landing page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mindbank:draft");
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && name.trim().length < 2) return setError("Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");

    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      }
      goNext(mode);
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
      setLoading(false);
    }
  };

  const google = async () => {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
      goNext("login");
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-xl bg-white py-3 pl-11 pr-4 outline-none ring-1 ring-ink/15 transition focus:ring-2 focus:ring-violet";

  return (
    <MotionConfig reducedMotion="user">
      <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-ink text-white lg:block">
          {imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={SIDE_IMG} alt="" onError={() => setImgOk(false)} className="absolute inset-0 h-full w-full object-cover opacity-35" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet/60 to-emerald/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <motion.div aria-hidden animate={{ x: [0, 30, 0], y: [0, 20, 0] }} transition={{ duration: 14, repeat: Infinity }} className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet/40 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between p-12">
            <a href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-ink"><Brain size={18} /></span>
              MindBank <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-xs">AI</span>
            </a>

            <div>
              {draft?.amount ? (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="glass max-w-sm rounded-3xl p-6 !text-ink shadow-2xl">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-violet"><Sparkles size={15} /> Your goal is waiting</p>
                  <p className="font-display mt-2 text-4xl font-extrabold">₦{Number(draft.amount).toLocaleString("en-NG")}</p>
                  {draft.goal && <p className="mt-2 text-sm text-ink/65">“{draft.goal}”</p>}
                </motion.div>
              ) : null}
              <h2 className="font-display mt-8 max-w-md text-4xl font-extrabold leading-tight">
                Think it. Plan it. Earn it. Withdraw it.
              </h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-white/70"><ShieldCheck size={16} /> No loans. No debt. Just a plan.</p>
            </div>
          </div>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-md">
            <a href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink">
              <ArrowLeft size={16} /> Back to home
            </a>

            <div role="tablist" className="relative grid grid-cols-2 rounded-2xl bg-ink/[0.06] p-1">
              {(["signup", "login"] as Mode[]).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }} className="relative z-10 py-2.5 text-sm font-semibold">
                  {mode === m && <motion.span layoutId="tab" className="absolute inset-0 -z-10 rounded-xl bg-white shadow" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  {m === "signup" ? "Create account" : "Log in"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display mt-8 text-3xl font-extrabold">
                  {mode === "signup" ? "Create your account" : "Welcome back"}
                </h1>
                <p className="mt-2 text-ink/60">
                  {mode === "signup" ? "Next, you’ll answer a few questions so we can build your plan." : "Log in to continue with your plan."}
                </p>

                <form onSubmit={submit} className="mt-7 space-y-3" noValidate>
                  {mode === "signup" && (
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                      <input aria-label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field} />
                    </div>
                  )}
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input aria-label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={field} />
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input aria-label="Password" type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" className={`${field} pr-12`} />
                    <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 font-bold text-white transition hover:bg-violet disabled:opacity-70">
                    {loading ? <><Loader2 className="animate-spin" size={18} /> {mode === "signup" ? "Creating account" : "Logging in"}</> : mode === "signup" ? "Create account" : "Log in"}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-xs text-ink/40"><span className="h-px flex-1 bg-ink/10" />or<span className="h-px flex-1 bg-ink/10" /></div>

                <button onClick={google} className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 font-semibold ring-1 ring-ink/15 transition hover:bg-paper">
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.600 2.400 30.200 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.800 6.100C12.300 13.600 17.700 9.500 24 9.500z"/><path fill="#4285F4" d="M46.500 24.500c0-1.600-.1-3.100-.4-4.500H24v9h12.700c-.6 3-2.300 5.500-4.800 7.200l7.500 5.800c4.400-4.100 7.100-10.100 7.100-17.500z"/><path fill="#FBBC05" d="M10.400 28.700A14.500 14.500 0 0 1 9.500 24c0-1.600.3-3.200.9-4.700l-7.800-6.100A24 24 0 0 0 0 24c0 3.900.9 7.500 2.600 10.800l7.800-6.100z"/><path fill="#34A853" d="M24 48c6.200 0 11.400-2 15.200-5.500l-7.500-5.800c-2 1.400-4.700 2.300-7.700 2.300-6.300 0-11.700-4.100-13.600-9.800l-7.800 6.100C6.500 42.600 14.600 48 24 48z"/></svg>
                  Continue with Google
                </button>
              </motion.div>
            </AnimatePresence>

            <p className="mt-8 text-center text-xs text-ink/45">
              By continuing, you agree to the Terms and Privacy Policy. MindBank doesn’t lend money.
            </p>
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}