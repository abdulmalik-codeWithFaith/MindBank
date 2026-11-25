"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { saveSetup, useUserDoc } from "@/lib/store";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Briefcase, Check, Clock, Loader2, PiggyBank, Sparkles, Target, Wallet } from "lucide-react";

type Form = {
  status: string; income: string; skills: string[]; otherSkill: string;
  expenses: string; savings: string; hours: string; deadline: string;
};
const empty: Form = { status: "", income: "", skills: [], otherSkill: "", expenses: "", savings: "", hours: "", deadline: "" };

const STATUS = ["Employed", "Self-employed", "Student", "Unemployed"];
const SKILLS = ["Web development", "Mobile apps", "Coding", "Graphic design", "Writing", "Video editing", "Data analysis", "Virtual assistant", "Social media", "Sales", "Teaching", "Translation", "Data entry", "Photography", "Customer support", "Fashion / tailoring", "Cooking", "Makeup"];
const HOURS = ["Under 1 hour", "1–2 hours", "3–4 hours", "5+ hours"];
const DEADLINES = ["1 week", "2 weeks", "1 month", "3 months", "6 months"];
const STEPS = [
  { t: "Your income", d: "Tell us what you earn now.", icon: Briefcase },
  { t: "Your skills", d: "Pick everything you can do, even casually.", icon: Sparkles },
  { t: "Money in and out", d: "Your monthly spending and what you’ve already saved.", icon: PiggyBank },
  { t: "Your time", d: "How much time you have and when you need the money.", icon: Clock },
];
const n = (v: string) => Number(v || 0);
const naira = (v: number) => "₦" + v.toLocaleString("en-NG");

const input = "w-full rounded-xl bg-white px-4 py-3.5 text-lg font-semibold outline-none ring-1 ring-ink/15 transition focus:ring-2 focus:ring-violet";
const Money = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink/70">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-violet">₦</span>
      <input id={id} inputMode="numeric" value={value ? Number(value).toLocaleString("en-NG") : ""} onChange={onChange} placeholder="0" className={`${input} pl-9`} />
    </div>
  </div>
);
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button type="button" aria-pressed={on} onClick={onClick} className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${on ? "bg-ink text-white ring-ink" : "bg-white ring-ink/15 hover:ring-violet"}`}>
    {on && <Check size={14} />}{children}
  </button>
);


export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState<Form>(empty);
  const [goal, setGoal] = useState({ amount: "", goal: "" });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const userDoc = useUserDoc();
  const hydrated = useRef(false);

  // Load the saved goal and any earlier answers (once)
  useEffect(() => {
    if (userDoc === undefined) return;
    if (userDoc.goal) setGoal(userDoc.goal);
    if (!hydrated.current) {
      hydrated.current = true;
      if (userDoc.assessment) setF({ ...empty, ...userDoc.assessment });
    }
  }, [userDoc]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const num = (k: "income" | "expenses" | "savings") => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value.replace(/\D/g, "").slice(0, 10));
  const toggle = (s: string) => set("skills", f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s]);

  const valid = [
    !!f.status && f.income !== "",
    f.skills.length > 0 || f.otherSkill.trim() !== "",
    f.expenses !== "" && f.savings !== "",
    !!f.hours && !!f.deadline,
  ][step];

  // Live reality check shown beside the form
  const target = n(goal.amount);
  const surplus = n(f.income) - n(f.expenses);
  const gap = Math.max(target - n(f.savings), 0);
  const pct = target ? Math.min(Math.round((n(f.savings) / target) * 100), 100) : 0;

  const go = (d: number) => { setDir(d); setStep((s) => s + d); };
  const finish = async () => {
    if (!goal.amount) { setSaveError("Enter your amount and goal on the home page first."); return; }
    setBusy(true); setSaveError("");
    try {
      saveSetup(goal, f);
      router.push("/plan");
    } catch (err) {
      console.error("save setup:", err);
      setSaveError("We couldn’t save your answers. Check your connection and try again.");
      setBusy(false);
    }
  };

  const body = useMemo(() => step, [step]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Brain size={18} /></span>MindBank
          </a>
          <p className="text-sm font-medium text-ink/55">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-6xl gap-8 lg:grid-cols-[1.25fr_1fr]">
          {/* Form card */}
          <section className="glass rounded-[2rem] p-6 sm:p-10">
            <div className="flex gap-2" aria-hidden>
              {STEPS.map((_, i) => (
                <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                  <motion.div animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-violet to-emerald" />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={body} custom={dir} initial={{ opacity: 0, x: 40 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * dir }} transition={{ duration: 0.3 }} className="mt-8 min-h-[340px]">
                <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{STEPS[step].t}</h1>
                <p className="mt-2 text-ink/60">{STEPS[step].d}</p>

                <div className="mt-8 space-y-6">
                  {step === 0 && (<>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-ink/70">What best describes you?</p>
                      <div className="flex flex-wrap gap-2">{STATUS.map((s) => <Chip key={s} on={f.status === s} onClick={() => set("status", s)}>{s}</Chip>)}</div>
                    </div>
                    <Money id="inc" label="Monthly income (enter 0 if none)" value={f.income} onChange={num("income")} />
                  </>)}

                  {step === 1 && (<>
                    <div className="flex flex-wrap gap-2">{SKILLS.map((s) => <Chip key={s} on={f.skills.includes(s)} onClick={() => toggle(s)}>{s}</Chip>)}</div>
                    <div>
                      <label htmlFor="os" className="mb-1.5 block text-sm font-semibold text-ink/70">Anything else?</label>
                      <input id="os" value={f.otherSkill} onChange={(e) => set("otherSkill", e.target.value)} placeholder="e.g. I am a React developer, logo designer, tutor" className={input} />
                    </div>
                  </>)}

                  {step === 2 && (<>
                    <Money id="exp" label="Monthly expenses (rent, food, transport, data)" value={f.expenses} onChange={num("expenses")} />
                    <Money id="sav" label="Money you’ve already saved" value={f.savings} onChange={num("savings")} />
                  </>)}

                  {step === 3 && (<>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-ink/70">Free time per day for earning</p>
                      <div className="flex flex-wrap gap-2">{HOURS.map((h) => <Chip key={h} on={f.hours === h} onClick={() => set("hours", h)}>{h}</Chip>)}</div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-ink/70">When do you need the money?</p>
                      <div className="flex flex-wrap gap-2">{DEADLINES.map((d) => <Chip key={d} on={f.deadline === d} onClick={() => set("deadline", d)}>{d}</Chip>)}</div>
                    </div>
                  </>)}
                </div>
              </motion.div>
            </AnimatePresence>

            {saveError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => go(-1)} disabled={step === 0 || busy} className="flex items-center gap-1.5 font-semibold text-ink/60 transition hover:text-ink disabled:invisible">
                <ArrowLeft size={18} /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button onClick={() => go(1)} disabled={!valid} className="flex items-center gap-2 rounded-xl bg-ink px-7 py-3.5 font-bold text-white transition hover:bg-violet disabled:cursor-not-allowed disabled:opacity-40">
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button onClick={finish} disabled={!valid || busy} className="shine flex items-center gap-2 rounded-xl bg-ink px-7 py-3.5 font-bold text-white transition hover:bg-violet disabled:cursor-not-allowed disabled:opacity-40">
                  {busy ? <><Loader2 size={18} className="animate-spin" /> Building your plan</> : <><Sparkles size={18} /> Create my plan</>}
                </button>
              )}
            </div>
          </section>

          {/* Goal summary */}
          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[2rem] bg-ink p-8 text-white">
              <p className="flex items-center gap-2 text-sm text-white/60"><Target size={16} /> Your goal</p>
              <p className="font-display mt-2 text-4xl font-extrabold">{target ? naira(target) : "Not set"}</p>
              {goal.goal && <p className="mt-2 text-sm text-white/70">“{goal.goal}”</p>}
              <div className="mt-6 h-2.5 rounded-full bg-white/15">
                <motion.div animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 80, damping: 18 }} className="h-full rounded-full bg-gradient-to-r from-violet to-emerald" />
              </div>
              <p className="mt-2 text-xs text-white/60">{pct}% already saved</p>
            </div>

            <div className="glass grid grid-cols-2 gap-4 rounded-[2rem] p-6">
              <div>
                <p className="text-xs text-ink/55">Left to find</p>
                <p className="font-display text-2xl font-bold">{naira(gap)}</p>
              </div>
              <div>
                <p className="text-xs text-ink/55">Monthly surplus</p>
                <p className={`font-display text-2xl font-bold ${surplus < 0 ? "text-red-600" : "text-emerald"}`}>{naira(surplus)}</p>
              </div>
              <p className="col-span-2 flex items-start gap-2 text-sm text-ink/60">
                <Wallet size={16} className="mt-0.5 shrink-0" />
                {surplus < 0 ? "You spend more than you earn, so your plan will focus on new income first." : "This updates as you answer. Your plan will use it to set weekly targets."}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </MotionConfig>
  );
}