"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveGoal } from "@/lib/store";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Brain, CalendarCheck, CheckCircle2, Gamepad2, Landmark,
  ListChecks, Menu, Briefcase, PiggyBank, ShieldCheck, Sparkles, Target, Wallet, X,
} from "lucide-react";

/* Swap these for your own files in /public when you're ready. */
const IMG = {
  hero: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
  goal: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
  plan: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80",
  earn: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1000&q=80",
  track: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  cta: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
};

function Img({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [ok, setOk] = useState(true);
  return ok ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setOk(false)} className={`object-cover ${className}`} />
  ) : (
    <div role="img" aria-label={alt} className={`bg-gradient-to-br from-violet to-emerald ${className}`} />
  );
}

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};
const Reveal = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className={className}>
    {children}
  </motion.div>
);

const fmt = (v: string) => (v ? Number(v).toLocaleString("en-NG") : "");

export default function Home() {
  const router = useRouter();
  const [amount, setAmount] = useState("100000");
  const [goal, setGoal] = useState("");
  const [menu, setMenu] = useState(false);

  const withdraw = () => {
    if (!amount) return;
    saveGoal({ amount, goal: goal.trim() });
    router.push("/assessment");
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative overflow-x-clip">
        {/* NAV */}
        <header className="fixed inset-x-0 top-0 z-40">
          <div className="glass mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3">
            <a href="#top" className="flex items-center gap-2 font-display text-lg font-extrabold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-white"><Brain size={18} /></span>
              MindBank <span className="rounded-md bg-violet/10 px-1.5 py-0.5 text-xs font-bold text-violet">AI</span>
            </a>
            <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
              {[["How it works", "#how"], ["Features", "#features"], ["Ways to earn", "#earn"], ["Dashboard", "#track"]].map(([l, h]) => (
                <a key={h} href={h} className="transition hover:text-ink">{l}</a>
              ))}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <a href="/dashboard" className="text-sm font-semibold text-ink/80 hover:text-ink">Dashboard</a>
              <a href="#top" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet">Get started</a>
            </div>
            <button aria-label="Toggle menu" className="md:hidden" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
          </div>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass mx-4 mt-2 grid gap-3 rounded-2xl p-5 md:hidden">
                {[["How it works", "#how"], ["Features", "#features"], ["Ways to earn", "#earn"]].map(([l, h]) => (
                  <a key={h} href={h} onClick={() => setMenu(false)} className="font-medium">{l}</a>
                ))}
                <a href="#top" onClick={() => setMenu(false)} className="rounded-xl bg-ink py-2.5 text-center font-semibold text-white">Get started</a>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* HERO */}
        <section id="top" className="relative px-5 pb-24 pt-36 md:pt-44">
          <div className="grid-bg absolute inset-0 -z-10" />
          <motion.div aria-hidden animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity }} className="absolute -left-24 top-24 -z-10 h-80 w-80 rounded-full bg-violet/25 blur-3xl" />
          <motion.div aria-hidden animate={{ x: [0, -40, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity }} className="absolute -right-16 top-48 -z-10 h-80 w-80 rounded-full bg-emerald/25 blur-3xl" />

          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium">
                <Sparkles size={15} className="text-violet" /> MindBank doesn’t lend. It helps you earn.
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }} className="font-display mt-6 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
                Withdraw money from your mind to <span className="text-gradient">your bank account.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 max-w-lg text-lg text-ink/65">
                Name the amount you have in mind. Tell us what it’s for. Our AI builds a realistic plan to save and earn it, with no borrowing.
              </motion.p>

              {/* Interactive goal card */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8 }} className="glass mt-9 max-w-xl rounded-3xl p-5 shadow-[0_30px_80px_-30px_rgba(91,75,255,.45)]">
                <label htmlFor="amt" className="text-sm font-semibold text-ink/70">How much money do you have in your mind?</label>
                <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/10 focus-within:ring-2 focus-within:ring-violet">
                  <span className="font-display text-3xl font-bold text-violet">₦</span>
                  <input id="amt" inputMode="numeric" value={fmt(amount)} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="100,000" className="w-full bg-transparent font-display text-3xl font-bold outline-none" />
                </div>
                <p className="mt-1.5 text-xs text-ink/50">Your imagined money</p>

                <label htmlFor="goal" className="mt-4 block text-sm font-semibold text-ink/70">What do you want to spend it on?</label>
                <textarea id="goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="I want to buy a laptop before the end of this month..." className="mt-2 w-full resize-none rounded-2xl bg-white px-4 py-3 outline-none ring-1 ring-ink/10 focus:ring-2 focus:ring-violet" />

                <button onClick={withdraw} className="shine group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-base font-bold text-white transition hover:bg-violet">
                  <Wallet size={18} /> Withdraw my money
                  <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </button>
                <p className="mt-3 text-center text-sm text-ink/55">Your money goal starts with a thought.</p>
              </motion.div>
            </div>

            {/* Hero visual */}
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.9 }} className="relative mx-auto w-full max-w-md">
              <div className="overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-ink/10">
                <Img src={IMG.hero} alt="Woman planning her finances on a laptop" className="h-[520px] w-full" />
              </div>
              <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }} className="glass absolute -left-8 top-12 rounded-2xl p-4 shadow-xl">
                <p className="text-xs text-ink/55">Goal</p>
                <p className="font-display text-xl font-bold">₦{fmt(amount) || "100,000"}</p>
                <div className="mt-2 h-1.5 w-32 rounded-full bg-ink/10"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet to-emerald" /></div>
              </motion.div>
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 6, repeat: Infinity }} className="glass absolute -right-6 bottom-20 flex items-center gap-3 rounded-2xl p-4 shadow-xl">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald/15 text-emerald"><CheckCircle2 /></span>
                <div><p className="text-sm font-bold">Plan ready</p><p className="text-xs text-ink/55">3 ways to earn found</p></div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="border-y border-ink/10 bg-white/60 py-4 overflow-hidden">
          <div className="marquee flex w-max gap-12 whitespace-nowrap text-sm font-semibold text-ink/50">
            {Array.from({ length: 2 }).flatMap((_, i) =>
              ["Think it", "Plan it", "Earn it", "Withdraw it", "No loans", "No debt", "Verified opportunities", "Built for Nigeria and beyond"].map((t) => (
                <span key={t + i} className="flex items-center gap-12">{t}<span className="text-violet">✦</span></span>
              )))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-28">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">From a number in your head to a plan you can follow</h2>
            <p className="mt-4 text-lg text-ink/65">Six steps. Each one makes the amount feel less imaginary.</p>
          </Reveal>

          <div className="mt-16 space-y-20">
            {[
              { icon: Target, t: "Think of an amount and describe your goal", d: "Enter ₦100,000, $500, or any figure, then tell us what it’s for. You can do this before you sign up.", img: IMG.goal, alt: "Friends planning together with a laptop" },
              { icon: ListChecks, t: "Answer a few honest questions", d: "Your job, income, skills, expenses, savings and free time. This is what makes the plan yours, not generic.", img: IMG.plan, alt: "Desk with notebook and calculator" },
              { icon: Briefcase, t: "Get your plan and ways to earn", d: "Receive a saving strategy plus legitimate surveys, microtasks, gaming rewards, freelancing and skill-based gigs.", img: IMG.earn, alt: "Person working on a laptop at night" },
            ].map((s, i) => (
              <Reveal key={s.t} className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div className="overflow-hidden rounded-3xl ring-1 ring-ink/10 shadow-xl">
                  <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.6 }}><Img src={s.img} alt={s.alt} className="h-80 w-full" /></motion.div>
                </div>
                <div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet/10 text-violet"><s.icon /></span>
                  <h3 className="font-display mt-5 text-3xl font-bold">{s.t}</h3>
                  <p className="mt-3 max-w-md text-ink/65">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-ink px-5 py-28 text-white">
          <div className="mx-auto max-w-6xl">
            <Reveal className="max-w-2xl">
              <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Everything you need to earn it, not borrow it</h2>
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                { i: Brain, t: "AI financial assistant", d: "Ask anything about your goal and get answers shaped by your own numbers." },
                { i: PiggyBank, t: "Personalized saving plans", d: "A realistic split between cutting costs and growing income." },
                { i: ShieldCheck, t: "Verified earning options", d: "Surveys, microtasks and gigs we check before recommending." },
                { i: Gamepad2, t: "Gaming and survey rewards", d: "Low-effort ways to add small, steady amounts." },
                { i: Briefcase, t: "Skill-based income", d: "Freelancing and side hustles matched to what you already do well." },
                { i: CalendarCheck, t: "Daily and weekly actions", d: "Clear tasks for today, so the goal never feels too big." },
              ].map((f, i) => (
                <motion.div key={f.t} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} whileHover={{ y: -6 }} className="rounded-3xl bg-white/[0.06] p-7 ring-1 ring-white/10 transition hover:bg-white/10">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet to-emerald"><f.i size={20} /></span>
                  <h3 className="font-display mt-5 text-xl font-bold">{f.t}</h3>
                  <p className="mt-2 text-sm text-white/65">{f.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* EARN */}
        <section id="earn" className="mx-auto max-w-6xl px-5 py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Ways to earn, ranked by how fast they pay</h2>
              <p className="mt-4 max-w-md text-ink/65">Your plan lists opportunities that fit your time and skills, with realistic weekly earnings.</p>
              <ul className="mt-8 space-y-3">
                {["Online surveys and microtasks", "Gaming rewards", "Freelancing and side hustles", "Monetizing a skill you already have"].map((x) => (
                  <li key={x} className="flex items-center gap-3 font-medium"><CheckCircle2 className="text-emerald" size={20} />{x}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="relative">
              <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-ink/10"><Img src={IMG.track} alt="Analytics dashboard on a screen" className="h-96 w-full" /></div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="glass absolute -bottom-6 left-6 rounded-2xl p-4 shadow-xl">
                <p className="text-xs text-ink/55">This week</p>
                <p className="font-display text-2xl font-bold text-emerald">+₦18,500</p>
              </motion.div>
            </Reveal>
          </div>
        </section>

        {/* TRACK */}
        <section id="track" className="px-5 pb-28">
          <Reveal className="glass mx-auto max-w-6xl rounded-[2.5rem] p-8 md:p-14">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/15 text-emerald"><BarChart3 /></span>
                <h2 className="font-display mt-5 text-4xl font-extrabold">Watch the number become real</h2>
                <p className="mt-3 max-w-md text-ink/65">Track earnings, savings and progress in one dashboard until you hit your target.</p>
              </div>
              <div className="space-y-5">
                {[["Saved", 62, "from-violet to-violet"], ["Earned", 45, "from-emerald to-emerald"], ["Time left", 30, "from-gold to-gold"]].map(([l, v, c]) => (
                  <div key={l as string}>
                    <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>{l}</span><span>{v}%</span></div>
                    <div className="h-3 rounded-full bg-ink/10"><motion.div initial={{ width: 0 }} whileInView={{ width: `${v}%` }} viewport={{ once: true }} transition={{ duration: 1.3, ease: "easeOut" }} className={`h-full rounded-full bg-gradient-to-r ${c}`} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="px-5 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink text-white">
            <Img src={IMG.cta} alt="Person paying with a phone" className="absolute inset-0 h-full w-full opacity-25" />
            <div className="relative px-8 py-20 text-center">
              <h2 className="font-display mx-auto max-w-2xl text-4xl font-extrabold sm:text-5xl">Think it. Plan it. Earn it. Withdraw it.</h2>
              <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }} className="shine mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-ink transition hover:bg-gold">
                Start with your number <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-ink/10 px-5 py-10 text-center text-sm text-ink/55">
          <p className="flex items-center justify-center gap-2 font-semibold text-ink"><Landmark size={16} /> MindBank AI</p>
          <p className="mt-2">MindBank doesn’t lend money. Earning estimates are guidance, not guarantees.</p>
        </footer>

      </main>
    </MotionConfig>
  );
}