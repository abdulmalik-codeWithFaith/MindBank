"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import SignOutButton from "@/components/SignOutButton";
import { useUserDoc } from "@/lib/hooks";
import { getDb } from "@/lib/firebase";
import { planKey } from "@/lib/planKey";
import type { Plan } from "@/lib/db";
import { MotionConfig, motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, Brain, CalendarCheck, Check, Gauge, Loader2, PiggyBank, RefreshCw, Rocket, Target, TrendingUp } from "lucide-react";

const naira = (v: number) => "₦" + Math.round(v || 0).toLocaleString("en-NG");
const FEAS = {
  on_track: { label: "On track", cls: "bg-emerald/15 text-emerald" },
  stretch: { label: "A stretch", cls: "bg-gold/25 text-amber-700" },
  needs_more_time: { label: "Needs more time", cls: "bg-red-100 text-red-700" },
};
const MESSAGES = ["Reading your numbers", "Matching your skills", "Finding ways to earn", "Writing your weekly plan"];

export default function PlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userDoc = useUserDoc(user?.uid);
  const [fresh, setFresh] = useState<Plan | null>(null); // plan returned by the server this visit
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const requested = useRef("");

  const goal = userDoc?.goal ?? { amount: "", goal: "" };
  const done = userDoc?.done ?? {};
  const key = userDoc?.goal && userDoc.assessment ? planKey(userDoc.goal, userDoc.assessment) : "";
  // Use the saved plan only while it still matches the current goal and answers
  const plan: Plan | null = (userDoc?.plan && userDoc.planKey === key ? userDoc.plan : null) ?? fresh;

  // Missing goal or answers? Send the user to the right step.
  useEffect(() => {
    if (userDoc === undefined) return;
    if (!userDoc?.goal) router.replace("/");
    else if (!userDoc.assessment) router.replace("/assessment");
  }, [userDoc, router]);

  // No matching saved plan: ask the server to build one (it reads the answers from the database)
  useEffect(() => {
    if (!user || !key || plan) return;
    const token = `${key}#${attempt}`;
    if (requested.current === token) return;
    requested.current = token;
    setError("");
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/plan", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        setFresh(json.plan as Plan);
      } catch {
        setError("We couldn’t build your plan. Check your connection and try again.");
      }
    })();
  }, [user, key, plan, attempt]);

  const load = () => { setFresh(null); setError(""); setAttempt((a) => a + 1); };

  useEffect(() => { if (plan || error) return; const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 1400); return () => clearInterval(t); }, [plan, error]);

  const toggle = (k: string) => {
    if (!user) return;
    setDoc(doc(getDb(), "users", user.uid), { done: { [k]: !done[k] } }, { merge: true }).catch((e) => console.error("save task:", e));
  };

  const total = plan?.weeklyActions.reduce((s, w) => s + w.tasks.length, 0) ?? 0;
  const finished = Object.values(done).filter(Boolean).length;
  const pct = total ? Math.round((Math.min(finished, total) / total) * 100) : 0;

  if (error) return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="glass max-w-sm rounded-3xl p-8 text-center">
        <AlertCircle className="mx-auto text-red-600" />
        <p className="mt-3 font-semibold">{error}</p>
        <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-violet"><RefreshCw size={16} /> Try again</button>
      </div>
    </main>
  );

  if (!plan) return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="text-center" role="status">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet to-emerald text-white"><Brain size={28} /></motion.div>
        <h1 className="font-display mt-6 text-3xl font-extrabold">Building your plan</h1>
        <p className="mt-2 text-ink/60">{MESSAGES[msg]}...</p>
      </div>
    </main>
  );

  const feas = FEAS[plan.feasibility] ?? FEAS.stretch;
  const rise = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Brain size={18} /></span>MindBank</a>
          <div className="flex items-center gap-2">
            <a href="/earn" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5">Ways to earn</a>
            <a href="/dashboard" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-violet">Open dashboard</a>
            <SignOutButton />
          </div>
        </nav>

        {/* Hero summary */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mt-8 overflow-hidden rounded-[2.5rem] bg-ink p-8 text-white sm:p-12">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet/40 blur-3xl" />
          <div className="relative grid items-end gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${feas.cls}`}><Gauge size={14} />{feas.label}</span>
              <h1 className="font-display mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Your plan to withdraw {naira(Number(goal.amount))}</h1>
              {goal.goal && <p className="mt-3 text-white/65">“{goal.goal}”</p>}
              <p className="mt-4 max-w-lg text-white/80">{plan.summary}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/15">
              <p className="flex items-center gap-2 text-sm text-white/65"><Target size={15} /> Weekly target</p>
              <p className="font-display mt-1 text-4xl font-extrabold">{naira(plan.weeklyTarget)}</p>
              <div className="mt-4 h-2.5 rounded-full bg-white/15"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-violet to-emerald" /></div>
              <p className="mt-2 text-xs text-white/60">{pct}% of actions done</p>
            </div>
          </div>
        </motion.section>

        {/* Saving strategy */}
        <section className="mt-16">
          <motion.h2 {...rise} className="font-display flex items-center gap-3 text-3xl font-extrabold"><PiggyBank className="text-violet" /> How to save it</motion.h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {plan.savingStrategy.map((s, i) => (
              <motion.div key={s.title} {...rise} transition={{ delay: i * 0.08, duration: 0.6 }} className="glass rounded-3xl p-6">
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/65">{s.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Opportunities */}
        <section className="mt-16">
          <motion.h2 {...rise} className="font-display flex items-center gap-3 text-3xl font-extrabold"><TrendingUp className="text-emerald" /> Ways to earn</motion.h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {plan.opportunities.map((o, i) => (
              <motion.article key={o.title} {...rise} transition={{ delay: i * 0.08, duration: 0.6 }} whileHover={{ y: -4 }} className="rounded-3xl bg-white p-7 ring-1 ring-ink/10 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-violet">{o.type}</p>
                    <h3 className="font-display mt-1 text-2xl font-bold">{o.title}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    {o.weeklyEstimate ? (
                      <>
                        <p className="font-display text-xl font-extrabold text-emerald">~{naira(o.weeklyEstimate)}</p>
                        <p className="text-xs text-ink/50">per week · {o.effort} effort</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-emerald">{o.speed ?? "Varies"}</p>
                        <p className="text-xs text-ink/50">{o.platform ? `on ${o.platform}` : "you set your rate"}</p>
                      </>
                    )}
                  </div>
                </div>
                <ol className="mt-5 space-y-2 text-sm text-ink/70">
                  {o.steps.map((st, j) => (
                    <li key={j} className="flex gap-3"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/10 text-xs font-bold text-violet">{j + 1}</span>{st}</li>
                  ))}
                </ol>
                {o.url && (
                  <a href={o.url} {...(o.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet">
                    {o.url.startsWith("http") ? `Open ${o.platform ?? "site"}` : "See the list"} <ArrowUpRight size={15} />
                  </a>
                )}
              </motion.article>
            ))}
          </div>
        </section>

        {/* Weekly actions */}
        <section className="mt-16">
          <motion.h2 {...rise} className="font-display flex items-center gap-3 text-3xl font-extrabold"><CalendarCheck className="text-violet" /> Your weekly actions</motion.h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {plan.weeklyActions.map((w) => (
              <motion.div key={w.week} {...rise} className="glass rounded-3xl p-6">
                <h3 className="font-display text-xl font-bold">Week {w.week}</h3>
                <ul className="mt-4 space-y-2">
                  {w.tasks.map((t, j) => {
                    const k = `${w.week}-${j}`;
                    return (
                      <li key={k}>
                        <button onClick={() => toggle(k)} aria-pressed={!!done[k]} className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition hover:bg-ink/5">
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1 transition ${done[k] ? "bg-emerald text-white ring-emerald" : "ring-ink/25"}`}>{done[k] && <Check size={13} />}</span>
                          <span className={done[k] ? "text-ink/40 line-through" : ""}>{t}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section {...rise} className="mt-16 rounded-[2rem] bg-gradient-to-br from-violet to-emerald p-10 text-center text-white">
          <Rocket className="mx-auto" />
          <h2 className="font-display mt-3 text-3xl font-extrabold">Start with week 1 today</h2>
          <a href="/dashboard" className="shine mt-6 inline-block rounded-2xl bg-white px-8 py-3.5 font-bold text-ink">Track my progress</a>
        </motion.section>

        <p className="mt-10 pb-6 text-center text-xs text-ink/45">Earning estimates are guidance, not guarantees. MindBank doesn’t lend money. Check any platform before you sign up.</p>
      </main>
    </MotionConfig>
  );
}