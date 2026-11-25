"use client";

import { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------
   Everything the app remembers is kept in this browser (localStorage).
   There are no accounts, so nothing is shared between devices.
------------------------------------------------------------------- */

export type Goal = { amount: string; goal: string };
export type Assessment = {
  status: string; income: string; skills: string[]; otherSkill: string;
  expenses: string; savings: string; hours: string; deadline: string;
};
export type Plan = {
  summary: string;
  feasibility: "on_track" | "stretch" | "needs_more_time";
  weeklyTarget: number;
  savingStrategy: { title: string; detail: string }[];
  opportunities: { title: string; type: string; weeklyEstimate?: number; effort: string; steps: string[]; url?: string; platform?: string; speed?: string }[];
  weeklyActions: { week: number; tasks: string[] }[];
};
export type UserDoc = {
  goal?: Goal; assessment?: Assessment; plan?: Plan; planKey?: string;
  done?: Record<string, boolean>; start?: string;
  joined?: Record<string, boolean>; rate?: number;
};
export type Entry = { id: string; kind: "Earned" | "Saved"; source: string; amount: number; date: string; note: string; ts: number };

type Store = UserDoc & { entries: Entry[] };

const KEY = "mindbank:data";
const EMPTY: Store = { entries: [] };
const today = () => new Date().toISOString().slice(0, 10);

let cache: Store | null = null;
const listeners = new Set<() => void>();

function read(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache as Store;
}

function write(next: Store) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}

/** undefined until the browser has loaded the saved data. Updates live, also across tabs. */
function useStore(): Store | undefined {
  const [s, setS] = useState<Store | undefined>(undefined);
  useEffect(() => {
    const sync = () => setS(read());
    sync();
    listeners.add(sync);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; sync(); } };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(sync); window.removeEventListener("storage", onStorage); };
  }, []);
  return s;
}

export function useUserDoc(): UserDoc | undefined {
  const s = useStore();
  return useMemo(() => {
    if (!s) return undefined;
    const { entries, ...doc } = s; // eslint-disable-line @typescript-eslint/no-unused-vars
    return doc;
  }, [s]);
}

export function useEntries(): Entry[] | undefined {
  return useStore()?.entries;
}

/* ---- writes (call from event handlers or effects only) ---- */

export function saveDoc(patch: Partial<UserDoc>) {
  write({ ...read(), ...patch });
}

/** A new goal restarts the clock. The same goal keeps its start date. */
function startFor(goal: Goal): string {
  const cur = read();
  return cur.goal?.amount === goal.amount && cur.start ? cur.start : today();
}

export function saveGoal(goal: Goal) {
  saveDoc({ goal, start: startFor(goal) });
}

export function saveSetup(goal: Goal, assessment: Assessment) {
  saveDoc({ goal, assessment, start: startFor(goal) });
}

export function savePlan(plan: Plan, key: string) {
  saveDoc({ plan, planKey: key });
}

export function addEntry(e: Entry) {
  const cur = read();
  write({ ...cur, entries: [e, ...cur.entries] });
}

export function removeEntry(id: string) {
  const cur = read();
  write({ ...cur, entries: cur.entries.filter((x) => x.id !== id) });
}

/** Wipes everything saved in this browser. */
export function resetAll() {
  write({ entries: [] });
}