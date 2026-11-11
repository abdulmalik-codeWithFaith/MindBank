"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { BarChart3, Brain, CalendarClock, Flame, ListChecks, PartyPopper, PiggyBank, Plus, Target, Trash2, TrendingUp, Wallet } from "lucide-react";

type Entry = { id: string; kind: "Earned" | "Saved"; source: string; amount: number; date: string; note: string };

const SOURCES = ["Freelancing", "Surveys", "Microtasks", "Gaming rewards", "Selling items", "Salary savings", "Other"];
const WEEKS: Record<string, number> = { "1 week": 1, "2 weeks": 2, "1 month": 4, "3 months": 13, "6 months": 26 };
const MILESTONES = [25, 50, 75, 100];
const DAY = 86400000;
const naira = (v: number) => "₦" + Math.round(v).toLocaleString("en-NG");
const today = () => new Date().toISOString().slice(0, 10);
const read = <T,>(store: Storage, key: string, fallback: T): T => { try { const v = store.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

export default function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [goal, setGoal] = useState({ amount: "", goal: "" });
  const [baseSaved, setBaseSaved] = useState(0);
  const [weeks, setWeeks] = useState(4);
  const [start, setStart] = useState("");
  const [now, setNow] = useState(0); // set after mount so prerender never reads the clock
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tasks, setTasks] = useState({ done: 0, total: 0 });
  const [kind, setKind] = useState<Entry["kind"]>("Earned");
  const [source, setSource] = useState(SOURCES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [celebrate, setCelebrate] = useState<number | null>(null);

  useEffect(() => {
    // TODO: load goal + entries from Supabase/Firebase for the signed-in user (redirect to /auth if none)
    const g = read(sessionStorage, "mindbank:draft", null) ?? read(localStorage, "mindbank:goal", null);
    const a = read<{ savings?: string; deadline?: string } | null>(sessionStorage, "mindbank:assessment", null) ?? read(localStorage, "mindbank:assessmentMeta", null);
    if (!g) { window.location.href = "/"; return; }
    setGoal(g);
    setBaseSaved(Number(a?.savings || 0));
    setWeeks(WEEKS[a?.deadline ?? ""] ?? 4);
    try {
      localStorage.setItem("mindbank:goal", JSON.stringify(g));
      localStorage.setItem("mindbank:assessmentMeta", JSON.stringify({ savings: a?.savings, deadline: a?.deadline }));
      if (!localStorage.getItem("mindbank:start")) localStorage.setItem("mindbank:start", today());
    } catch {}
    setStart(read(localStorage, "mindbank:start", today()));
    setEntries(read(localStorage, "mindbank:entries", []));
    const done = Object.values(read<Record<string, boolean>>(localStorage, "mindbank:done", {})).filter(Boolean).length;
    setTasks({ done, total: Math.max(done, 12) });
    setNow(Date.now());
    setReady(true);
  }, []);

  const target = Number(goal.amount || 0);
  const logged = entries.reduce((s, e) => s + e.amount, 0);
  const total = baseSaved + logged;
  const pct = target ? Math.min(Math.round((total / target) * 100), 100) : 0;
  const left = Math.max(target - total, 0);
  const daysLeft = start && now ? Math.max(Math.ceil((new Date(start).getTime() + weeks * 7 * DAY - now) / DAY), 0) : 0;
  const perDay = daysLeft ? Math.ceil(left / daysLeft) : left;

  // Last 6 weeks of logged money
  const bars = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const from = now - (6 - i) * 7 * DAY, to = from + 7 * DAY;
      const sum = entries.filter((e) => { const t = new Date(e.date).getTime(); return t > from && t <= to; }).reduce((s, e) => s + e.amount, 0);
      return { label: i === 5 ? "This wk" : `${5 - i}w ago`, sum };
    });
  }, [entries, now]);
  const max = Math.max(...bars.map((b) => b.sum), 1);

  const bySource = useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach((e) => (m[e.source] = (m[e.source] || 0) + e.amount));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Streak = consecutive days (ending today or yesterday) with at least one entry
  const streak = useMemo(() => {
    const days = new Set(entries.map((e) => e.date));
    if (!now) return 0;
    let d = new Date(now); if (!days.has(d.toISOString().slice(0, 10))) d = new Date(now - DAY);
    let n = 0;
    while (days.has(d.toISOString().slice(0, 10))) { n++; d = new Date(d.getTime() - DAY); }
    return n;
  }, [entries, now]);

  const persist = (next: Entry[]) => { setEntries(next); try { localStorage.setItem("mindbank:entries", JSON.stringify(next)); } catch {} };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const v = Number(amount.replace(/\D/g, ""));
    if (!v) return;
    const before = target ? Math.floor((total / target) * 100) : 0;
    const after = target ? Math.floor(((total + v) / target) * 100) : 0;
    const hit = MILESTONES.filter((m) => before < m && after >= m).pop();
    persist([{ id: crypto.randomUUID(), kind, source, amount: v, date: today(), note: note.trim() }, ...entries]);
    setAmount(""); setNote("");
    if (hit) { setCelebrate(hit); setTimeout(() => setCelebrate(null), 4500); }
  };

  if (!ready) return <main className="grid min-h-screen place-items-center text-ink/50">Loading your dashboard...</main>;

  const R = 74, C = 2 * Math.PI * R;
  const stats = [
    { i: Wallet, l: "Total so far", v: naira(total), c: "text-violet" },
    { i: Target, l: "Left to find", v: naira(left), c: "text-ink" },
    { i: CalendarClock, l: daysLeft ? `Per day, ${daysLeft} days left` : "Deadline reached", v: naira(perDay), c: "text-emerald" },
    { i: Flame, l: "Day streak", v: String(streak), c: "text-amber-600" },
  ];
  const field = "w-full rounded-xl bg-white px-4 py-3 outline-none ring-1 ring-ink/15 transition focus:ring-2 focus:ring-violet";

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Brain size={18} /></span>MindBank</a>
          <a href="/plan" className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/15 hover:bg-paper"><ListChecks size={16} /> My plan</a>
        </nav>

        <AnimatePresence>
          {celebrate && (
            <motion.div role="status" initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 top-5 z-50 mx-auto flex w-fit items-center gap-3 rounded-2xl bg-ink px-6 py-4 font-bold text-white shadow-2xl">
              <PartyPopper className="text-gold" /> {celebrate === 100 ? "Goal reached. Time to withdraw it." : `${celebrate}% of your goal is in.`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header: ring + goal */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mt-8 overflow-hidden rounded-[2.5rem] bg-ink p-8 text-white sm:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet/40 blur-3xl" />
          <div className="relative flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm text-white/60">Your goal</p>
              <h1 className="font-display mt-1 text-4xl font-extrabold sm:text-5xl">{naira(target)}</h1>
              {goal.goal && <p className="mt-2 max-w-md text-white/70">“{goal.goal}”</p>}
              <p className="mt-4 text-sm text-white/60">{pct >= 100 ? "You’ve reached your target." : `${naira(left)} to go.`}</p>
            </div>
            <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`${pct}% of goal reached`}>
              <svg viewBox="0 0 180 180" className="-rotate-90">
                <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="14" />
                <motion.circle cx="90" cy="90" r={R} fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct / 100) }} transition={{ duration: 1.4, ease: "easeOut" }} />
                <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#7c6dff" /><stop offset="1" stopColor="#12b981" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-display text-4xl font-extrabold">{pct}%</p><p className="text-xs text-white/60">reached</p></div></div>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="glass rounded-3xl p-5">
              <s.i size={18} className="text-ink/40" />
              <p className={`font-display mt-3 text-2xl font-extrabold ${s.c}`}>{s.v}</p>
              <p className="mt-0.5 text-xs text-ink/55">{s.l}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Log form */}
          <section className="glass rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><Plus className="text-violet" /> Log money</h2>
            <form onSubmit={add} className="mt-5 space-y-3">
              <div role="group" aria-label="Type" className="grid grid-cols-2 rounded-xl bg-ink/[0.06] p-1">
                {(["Earned", "Saved"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`rounded-lg py-2 text-sm font-semibold transition ${kind === k ? "bg-white shadow" : "text-ink/60"}`}>{k}</button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-violet">₦</span>
                <input aria-label="Amount" inputMode="numeric" value={amount ? Number(amount.replace(/\D/g, "")).toLocaleString("en-NG") : ""} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className={`${field} pl-9 text-lg font-semibold`} />
              </div>
              <select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value)} className={field}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
              <input aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={field} />
              <button disabled={!amount} className="shine w-full rounded-xl bg-ink py-3.5 font-bold text-white transition hover:bg-violet disabled:opacity-40">Add to my total</button>
            </form>
          </section>

          {/* Chart */}
          <section className="glass rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><BarChart3 className="text-emerald" /> Last 6 weeks</h2>
            <div className="mt-6 flex h-44 items-end gap-3">
              {bars.map((b, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[11px] font-semibold text-ink/55">{b.sum ? naira(b.sum) : ""}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((b.sum / max) * 100, b.sum ? 6 : 2)}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} className={`w-full rounded-t-lg ${i === 5 ? "bg-gradient-to-t from-violet to-emerald" : "bg-violet/25"}`} />
                  <span className="text-[11px] text-ink/50">{b.label}</span>
                </div>
              ))}
            </div>
            {bySource.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {bySource.map(([s, v]) => <span key={s} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-ink/10">{s}: {naira(v)}</span>)}
              </div>
            )}
          </section>
        </div>

        {/* Plan progress + history */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="glass rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><TrendingUp className="text-violet" /> Plan actions</h2>
            <p className="font-display mt-4 text-4xl font-extrabold">{tasks.done}<span className="text-lg text-ink/40"> done</span></p>
            <p className="mt-1 text-sm text-ink/60">Tick off weekly actions on your plan page to keep this moving.</p>
            <a href="/plan" className="mt-5 inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet">Open plan</a>
          </section>

          <section className="glass rounded-[2rem] p-6 sm:p-8">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><PiggyBank className="text-emerald" /> History</h2>
            {entries.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-white/70 p-5 text-sm text-ink/60">Nothing logged yet. Add your first earning or saving to start moving the ring.</p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {entries.map((e) => (
                    <motion.li key={e.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{e.source}<span className="ml-2 text-xs font-medium text-ink/45">{e.kind} · {e.date}</span></p>
                        {e.note && <p className="truncate text-sm text-ink/55">{e.note}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-emerald">+{naira(e.amount)}</span>
                        <button aria-label={`Delete ${e.source} entry`} onClick={() => persist(entries.filter((x) => x.id !== e.id))} className="text-ink/35 transition hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </div>

        <p className="mt-10 pb-6 text-center text-xs text-ink/45">Your entries are saved on this device for now. MindBank doesn’t lend money.</p>
      </main>
    </MotionConfig>
  );
}