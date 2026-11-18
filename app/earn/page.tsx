"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import SignOutButton from "@/components/SignOutButton";
import { useUserDoc } from "@/lib/hooks";
import { getDb } from "@/lib/firebase";
import { matchGigs, normalizeSkills } from "@/lib/opportunities";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertTriangle, BadgeCheck, Brain, Check, ClipboardList, ExternalLink, MousePointerClick, ShieldCheck, Wallet, Zap } from "lucide-react";

/* ------------------------------------------------------------------
   PLATFORM DATA. Edit this list as you re-check each site.
   Figures come from third-party reviews and user reports (checked Nov 2026),
   not from a live feed. Pay and payout rules change often, so every card
   tells users to confirm on the platform before they rely on it.
------------------------------------------------------------------- */
const LAST_CHECKED = "November 2026";

type Platform = {
  id: string; name: string; kind: "survey" | "microtask"; url: string;
  payPerTask: string; monthlyUSD?: [number, number]; minPayout: string; minUSD?: number;
  payout: string; nigeria: string; note: string;
};

const PLATFORMS: Platform[] = [
  { id: "swagbucks", name: "Swagbucks", kind: "survey", url: "https://www.swagbucks.com",
    payPerTask: "About $0.50–$2 per short survey", minPayout: "$1–$5 (gift cards or PayPal)", minUSD: 3,
    payout: "PayPal, gift cards", nigeria: "Reported open to Nigerians; some offers are locked by country",
    note: "Also pays for videos and small tasks. Low cashout, so a good first payout." },
  { id: "toluna", name: "Toluna", kind: "survey", url: "https://www.toluna.com",
    payPerTask: "Small amounts per survey, often ₦50–₦500 equivalent", minPayout: "$5–$10", minUSD: 7,
    payout: "PayPal, gift cards", nigeria: "Reported available; survey supply varies",
    note: "Points can expire. Cash out once in a while instead of waiting." },
  { id: "ysense", name: "ySense", kind: "survey", url: "https://www.ysense.com",
    payPerTask: "About $0.50–$2 per survey, plus tasks and offers", minPayout: "About $10 for PayPal (other methods vary)", minUSD: 10,
    payout: "PayPal, Skrill, Payoneer", nigeria: "Commonly reported by Nigerian users",
    note: "Complete your profile fully. It decides how many surveys you see." },
  { id: "surveoo", name: "Surveoo", kind: "survey", url: "https://surveoo.com",
    payPerTask: "Varies by survey", minPayout: "$3", minUSD: 3,
    payout: "Crypto, Skrill, AirTM, PayPal, bank transfer", nigeria: "Reported to support Nigeria with bank transfer",
    note: "Newer site. Cash out early and often while you build trust." },
  { id: "timebucks", name: "Timebucks", kind: "survey", url: "https://timebucks.com",
    payPerTask: "Cents per task, more for surveys and offers", minPayout: "Check the dashboard", 
    payout: "Skrill, AirTM, Payeer, bank transfer, crypto", nigeria: "Reported to pay Nigerians",
    note: "Mixes surveys, micro jobs and offers. Ignore anything that asks you to pay." },
  { id: "clickworker", name: "Clickworker", kind: "microtask", url: "https://www.clickworker.com",
    payPerTask: "About €5 ($5–$6) per hour, task by task", monthlyUSD: [10, 50], minPayout: "€10, paid weekly", minUSD: 11,
    payout: "Payoneer (PayPal in some countries)", nigeria: "Accepts many countries. Tasks vary by region",
    note: "Text checks, search relevance and image tagging. Do assessments to unlock more tasks." },
  { id: "microworkers", name: "Microworkers", kind: "microtask", url: "https://www.microworkers.com",
    payPerTask: "$0.05–$1.00 per task", minPayout: "About $9", minUSD: 9,
    payout: "PayPal and others", nigeria: "Open to many countries",
    note: "App testing, quick surveys, web research. Do many small jobs fast." },
  { id: "toloka", name: "Toloka", kind: "microtask", url: "https://toloka.ai",
    payPerTask: "$0.01–$0.50 per task, roughly $2–$10 per hour", monthlyUSD: [10, 60], minPayout: "Reports range from $0.20 to $20. Check in app", minUSD: 5,
    payout: "Payoneer, PayPal", nigeria: "Reported popular in Africa. Check payout route at signup",
    note: "Image matching and answer checking. Some work has moved to Mindrift." },
  { id: "crowdgen", name: "CrowdGen by Appen", kind: "microtask", url: "https://crowdgen.com",
    payPerTask: "About $5–$15 per hour on project work", minPayout: "Per project", 
    payout: "Payoneer", nigeria: "Reported to accept Nigerians",
    note: "Search and social media evaluation. Projects start and stop, so keep other platforms open." },
];

const TABS = [["skills", "For my skills"], ["all", "All"], ["survey", "Surveys"], ["microtask", "Microtasks"]] as const;
const naira = (v: number) => "₦" + Math.round(v).toLocaleString("en-NG");

export default function EarnPage() {
  const { user } = useAuth();
  const userDoc = useUserDoc(user?.uid);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("skills");
  const [rate, setRate] = useState("1500");

  const joined = userDoc?.joined ?? {};
  const a = userDoc?.assessment;
  const skillNames = a ? normalizeSkills(a.skills, a.otherSkill) : [];
  const gigs = a ? matchGigs(a.skills, a.otherSkill, 12) : [];

  useEffect(() => { if (userDoc?.rate) setRate(String(userDoc.rate)); }, [userDoc?.rate]);

  const save = (patch: Record<string, unknown>) => {
    if (!user) return;
    setDoc(doc(getDb(), "users", user.uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.error("save:", e));
  };
  const toggle = (id: string) => save({ joined: { [id]: !joined[id] } });
  const setRateSaved = (v: string) => setRate(v.replace(/\D/g, "").slice(0, 5));
  const saveRate = () => { const v = Number(rate); if (v > 0) save({ rate: v }); };

  const r = Number(rate) || 0;
  const list = useMemo(() => PLATFORMS.filter((p) => tab !== "skills" && (tab === "all" || p.kind === tab)).sort((a, b) => (a.minUSD ?? 99) - (b.minUSD ?? 99)), [tab]);
  const count = Object.values(joined).filter(Boolean).length;

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-6xl px-5 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Brain size={18} /></span>MindBank</a>
          <div className="flex gap-2">
            <a href="/plan" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold ring-1 ring-ink/15 hover:bg-paper">My plan</a>
            <a href="/dashboard" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-violet">Log earnings</a>
            <SignOutButton />
          </div>
        </nav>

        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mt-8 overflow-hidden rounded-[2.5rem] bg-ink p-8 text-white sm:p-12">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald/30 blur-3xl" />
          <div className="relative grid items-end gap-8 md:grid-cols-[1.5fr_1fr]">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Ways to earn that fit you</h1>
              <p className="mt-4 max-w-xl text-white/75">These pay small amounts, but they have low payout minimums, so your first withdrawal can come quickly. Each card shows what it pays, the minimum to cash out and a link to sign up.</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
              <label htmlFor="rate" className="text-sm text-white/65">Naira per $1 (edit to today’s rate)</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-ink">
                <span className="font-bold text-violet">₦</span>
                <input id="rate" inputMode="numeric" value={rate} onChange={(e) => setRateSaved(e.target.value)} onBlur={saveRate} className="w-full bg-transparent text-lg font-bold outline-none" />
              </div>
              <p className="mt-2 text-xs text-white/55">Joined: {count} of {PLATFORMS.length}</p>
            </div>
          </div>
        </motion.header>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gold/20 p-4 text-sm text-ink/80">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <p>Pay figures come from reviews and user reports, last checked {LAST_CHECKED}. They are not guarantees. Rates, payout minimums and Nigeria access change often, and each site shows what applies to you after you sign up. Expect small amounts. Most people earn from a few dollars to a few tens of dollars a month.</p>
        </div>

        <div role="tablist" className="mt-8 inline-flex rounded-2xl bg-ink/[0.06] p-1">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="relative px-5 py-2 text-sm font-semibold">
              {tab === k && <motion.span layoutId="etab" className="absolute inset-0 rounded-xl bg-white shadow" />}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>

        {tab === "skills" && (
          gigs.length ? (
            <>
              <p className="mt-6 text-sm text-ink/60">Matched to your skills: <span className="font-semibold text-ink">{skillNames.join(", ")}</span>. You set your own rate, so check similar listings before you price your work.</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {gigs.map((g, i) => (
                  <motion.article key={g.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-3xl bg-white p-6 ring-1 ring-ink/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-violet">{g.type}{g.platform ? ` · ${g.platform}` : ""}</span>
                        <h2 className="font-display mt-1 text-xl font-bold">{g.title}</h2>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald/15 px-2.5 py-1 text-xs font-bold text-emerald">{g.speed}</span>
                    </div>
                    <p className="mt-3 text-sm text-ink/65">{g.why}</p>
                    <ol className="mt-4 space-y-2 text-sm text-ink/75">
                      {g.steps.map((st, j) => (
                        <li key={j} className="flex gap-3"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/10 text-xs font-bold text-violet">{j + 1}</span>{st}</li>
                      ))}
                    </ol>
                    {g.url && (
                      <a href={g.url} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-bold text-white transition hover:bg-violet">
                        Open {g.platform} <ExternalLink size={15} />
                      </a>
                    )}
                  </motion.article>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-3xl bg-white p-6 text-sm text-ink/70 ring-1 ring-ink/10">
              Add your skills in the <a href="/assessment" className="font-semibold text-violet underline">assessment</a> to see work that fits you. You can type your own, for example “React developer”.
            </div>
          )
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.article key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }} className={`rounded-3xl bg-white p-6 ring-1 transition ${joined[p.id] ? "ring-emerald" : "ring-ink/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet to-emerald font-display text-xl font-extrabold text-white">{p.name[0]}</span>
                    <div>
                      <h2 className="font-display text-xl font-bold">{p.name}</h2>
                      <span className={`text-xs font-bold ${p.kind === "survey" ? "text-violet" : "text-emerald"}`}>{p.kind === "survey" ? "Survey site" : "Microtasks"}</span>
                    </div>
                  </div>
                  {p.minUSD && p.minUSD <= 6 && <span className="flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-1 text-xs font-bold text-emerald"><Zap size={12} /> Low cashout</span>}
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="col-span-2"><dt className="text-ink/50">Pays</dt><dd className="font-semibold">{p.payPerTask}</dd></div>
                  <div><dt className="text-ink/50">Minimum cashout</dt><dd className="font-semibold">{p.minPayout}</dd></div>
                  <div><dt className="text-ink/50">Paid via</dt><dd className="font-semibold">{p.payout}</dd></div>
                  {p.monthlyUSD && (
                    <div className="col-span-2 rounded-xl bg-paper p-3">
                      <dt className="text-ink/50">Reported monthly range</dt>
                      <dd className="font-display text-lg font-bold text-emerald">${p.monthlyUSD[0]}–${p.monthlyUSD[1]}{r ? <span className="ml-2 text-sm text-ink/60">≈ {naira(p.monthlyUSD[0] * r)}–{naira(p.monthlyUSD[1] * r)}</span> : null}</dd>
                    </div>
                  )}
                  <div className="col-span-2"><dt className="text-ink/50">Nigeria</dt><dd>{p.nigeria}</dd></div>
                </dl>
                <p className="mt-3 text-sm text-ink/65">{p.note}</p>

                <div className="mt-5 flex items-center gap-3">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-bold text-white transition hover:bg-violet">
                    Open {p.name} <ExternalLink size={15} />
                  </a>
                  <button onClick={() => toggle(p.id)} aria-pressed={!!joined[p.id]} className={`flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold ring-1 transition ${joined[p.id] ? "bg-emerald text-white ring-emerald" : "ring-ink/15 hover:bg-paper"}`}>
                    {joined[p.id] ? <><Check size={15} /> Joined</> : "I joined"}
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* How to start + safety */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section className="glass rounded-[2rem] p-7">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><ClipboardList className="text-violet" /> Start in 4 steps</h2>
            <ol className="mt-5 space-y-3 text-ink/75">
              {["Join 2 or 3 platforms. Supply on one site runs out, so spread across several.", "Fill in your profile completely and honestly. It decides which surveys you get.", "Set up Payoneer or the payout method the site supports, before you earn.", "Cash out as soon as you reach the minimum, then log it on your dashboard."].map((s, i) => (
                <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet/10 text-xs font-bold text-violet">{i + 1}</span>{s}</li>
              ))}
            </ol>
          </section>
          <section className="glass rounded-[2rem] p-7">
            <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold"><ShieldCheck className="text-emerald" /> Stay safe</h2>
            <ul className="mt-5 space-y-3 text-ink/75">
              {["Never pay to join, to unlock tasks, or for a “starter kit”. Real platforms are free.", "Use one account per person and real details. Duplicate accounts and VPNs can get you banned.", "Open sites only from the links here or by typing the address yourself.", "Cash out often. Treat any balance as at risk until it reaches your account.", "Prolific is not listed because it supports only certain countries and Nigeria is not on the main list."].map((s) => (
                <li key={s} className="flex gap-3"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald" />{s}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[2rem] bg-gradient-to-br from-violet to-emerald p-8 text-white sm:flex-row">
          <div className="flex items-center gap-3"><Wallet /><p className="font-display text-xl font-bold">Earned something? Log it and watch your goal move.</p></div>
          <a href="/dashboard" className="shine flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-ink"><MousePointerClick size={18} /> Open dashboard</a>
        </section>

        <p className="mt-8 pb-6 text-center text-xs text-ink/45">MindBank is not affiliated with these platforms and does not guarantee earnings. Always read each site’s terms before joining.</p>
      </main>
    </MotionConfig>
  );
}