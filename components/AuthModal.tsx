"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { Eye, EyeOff, Loader2, Lock, Mail, User, X } from "lucide-react";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

type Mode = "signup" | "login";

const friendly = (code?: string) => {
  switch (code) {
    case "auth/email-already-in-use": return "That email already has an account. Try logging in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Email or password is incorrect.";
    case "auth/weak-password": return "Use a stronger password (8+ characters).";
    case "auth/invalid-email": return "That email address doesn’t look right.";
    case "auth/operation-not-allowed": return "Email/password sign-in isn’t turned on in Firebase yet. Enable it under Authentication → Sign-in method.";
    case "auth/unauthorized-domain": return "This domain isn’t allowed in Firebase. Add it under Authentication → Settings → Authorized domains.";
    case "auth/configuration-not-found": return "Firebase Authentication isn’t set up for this project yet. Click Get started in the Authentication section.";
    case "auth/too-many-requests": return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed": return "Network problem. Check your connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "";
    default: return process.env.NODE_ENV !== "production" && code ? `Sign-in failed (${code}).` : "We couldn’t sign you in. Please try again.";
  }
};

export default function AuthModal({ open, onClose, amount }: { open: boolean; onClose: () => void; amount?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const first = useRef<HTMLInputElement>(null);

  // Close with Escape, focus the first field when opened
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => first.current?.focus(), 150);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, loading, onClose]);

  const goNext = (m: Mode) => {
    let hasAssessment = false;
    try { hasAssessment = !!localStorage.getItem("mindbank:assessmentMeta"); } catch {}
    router.push(m === "login" && hasAssessment ? "/dashboard" : "/assessment");
  };

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

  const field = "w-full rounded-xl bg-white py-3 pl-11 pr-4 outline-none ring-1 ring-ink/15 transition focus:ring-2 focus:ring-violet";
  const amt = amount ? Number(amount).toLocaleString("en-NG") : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-5 backdrop-blur-sm" onClick={() => !loading && onClose()}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="auth-title" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h3 id="auth-title" className="font-display text-2xl font-extrabold">{mode === "signup" ? "Create your account" : "Welcome back"}</h3>
              <button aria-label="Close" onClick={onClose} disabled={loading}><X /></button>
            </div>
            <p className="mt-2 text-sm text-ink/60">
              {amt ? <>Your ₦{amt} goal is saved. </> : null}
              {mode === "signup" ? "Create an account to answer a few questions and get your plan." : "Log in to continue with your plan."}
            </p>

            <div role="tablist" className="relative mt-5 grid grid-cols-2 rounded-xl bg-ink/[0.06] p-1">
              {(["signup", "login"] as Mode[]).map((m) => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }} className="relative z-10 py-2 text-sm font-semibold">
                  {mode === m && <motion.span layoutId="modal-tab" className="absolute inset-0 -z-10 rounded-lg bg-white shadow" />}
                  {m === "signup" ? "Create account" : "Log in"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} noValidate className="mt-5 space-y-3">
              {mode === "signup" && (
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input ref={first} aria-label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field} />
                </div>
              )}
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input ref={mode === "login" ? first : undefined} aria-label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={field} />
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
                  <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</motion.p>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading} className="shine flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 font-bold text-white transition hover:bg-violet disabled:opacity-70">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Please wait</> : mode === "signup" ? "Create account and continue" : "Log in"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-ink/40"><span className="h-px flex-1 bg-ink/10" />or<span className="h-px flex-1 bg-ink/10" /></div>
            <button onClick={google} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl py-3 font-semibold ring-1 ring-ink/15 transition hover:bg-paper disabled:opacity-70">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.7 2.3-7.7 2.3-6.300 0-11.700-4.100-13.600-9.800l-7.800 6.100C6.500 42.600 14.600 48 24 48z"/></svg>
              Continue with Google
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}