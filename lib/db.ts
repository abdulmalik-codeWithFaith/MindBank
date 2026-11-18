import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

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
  done?: Record<string, boolean>; start?: string; migrated?: boolean;
  joined?: Record<string, boolean>; rate?: number;
};
export type Entry = { id: string; kind: "Earned" | "Saved"; source: string; amount: number; date: string; note: string; ts: number };

const today = () => new Date().toISOString().slice(0, 10);
const readJson = <T,>(store: Storage, key: string): T | null => {
  try { const v = store.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
};

/** Save the goal and assessment answers. The plan itself is written only by the server. */
export async function saveSetup(uid: string, goal: Goal, assessment: Assessment) {
  await setDoc(doc(getDb(), "users", uid), { goal, assessment, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addEntry(uid: string, e: Entry) {
  await setDoc(doc(getDb(), "users", uid, "entries", e.id), e);
}
export async function removeEntry(uid: string, id: string) {
  await deleteDoc(doc(getDb(), "users", uid, "entries", id));
}

const done = new Set<string>();

/**
 * Runs once per signed-in user per page load:
 *  - creates the user document and start date
 *  - saves the goal typed on the landing page
 *  - moves any old on-device data (localStorage) into the account, one time
 */
export async function bootstrapUser(uid: string) {
  if (done.has(uid)) return;
  done.add(uid);
  const db = getDb();
  const ref = doc(db, "users", uid);
  const data = (await getDoc(ref)).data() as UserDoc | undefined;
  const patch: Record<string, unknown> = {};

  if (!data?.goal) {
    const draft = readJson<Goal>(sessionStorage, "mindbank:draft") ?? readJson<Goal>(localStorage, "mindbank:goal");
    if (draft?.amount) patch.goal = draft;
  }
  if (!data?.assessment) {
    const a = readJson<Assessment>(sessionStorage, "mindbank:assessment");
    if (a) patch.assessment = a;
  }
  if (!data?.start) patch.start = readJson<string>(localStorage, "mindbank:start") ?? today();

  const legacyKeys = ["mindbank:entries", "mindbank:done", "mindbank:goal", "mindbank:assessmentMeta", "mindbank:start"];
  if (!data?.migrated) {
    const entries = readJson<Omit<Entry, "ts">[]>(localStorage, "mindbank:entries") ?? [];
    if (entries.length) {
      const batch = writeBatch(db);
      entries.forEach((e, i) => batch.set(doc(db, "users", uid, "entries", e.id), { ...e, ts: new Date(e.date).getTime() + i }));
      await batch.commit();
    }
    patch.done = readJson<Record<string, boolean>>(localStorage, "mindbank:done") ?? {};
    patch.migrated = true;
  }

  if (Object.keys(patch).length) {
    await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  }
  if (patch.migrated) { try { legacyKeys.forEach((k) => localStorage.removeItem(k)); } catch {} }
}