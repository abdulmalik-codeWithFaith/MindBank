import { NextResponse } from "next/server";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { planKey } from "@/lib/planKey";
import { buildOpportunities, normalizeSkills } from "@/lib/opportunities";

// Route handlers run on Node.js by default, which firebase-admin needs. Do not set `runtime` here.
export const maxDuration = 60; // seconds. Plan building can take longer than a host's 10s default

/* .env.local needs GEMINI_API_KEY (optional GEMINI_MODEL) and the FIREBASE_* admin values. */

type Goal = { amount: string; goal: string };
type Assessment = {
  status: string; income: string; skills: string[]; otherSkill: string;
  expenses: string; savings: string; hours: string; deadline: string;
};

const WEEKS: Record<string, number> = { "1 week": 1, "2 weeks": 2, "1 month": 4, "3 months": 13, "6 months": 26 };
const n = (v: number) => Math.round(v).toLocaleString("en-NG");

/** Numbers and weekly steps. Always works, even without Gemini. */
function basePlan(g: Goal, a: Assessment) {
  const target = Number(g.amount || 0);
  const gap = Math.max(target - Number(a.savings || 0), 0);
  const weeks = WEEKS[a.deadline] ?? 4;
  const weekly = Math.ceil(gap / weeks);
  const surplus = Math.max(Number(a.income || 0) - Number(a.expenses || 0), 0);
  const fromSurplus = Math.min(Math.round((surplus / 4.3) * weeks), gap);
  const opportunities = buildOpportunities(a.skills, a.otherSkill);
  const lead = opportunities[0]?.title ?? "your first earning idea";
  return {
    summary: `You need ₦${n(gap)} more in ${a.deadline}. That is about ₦${n(weekly)} a week.`,
    feasibility: (weekly <= surplus / 4.3 ? "on_track" : weekly <= (surplus / 4.3) * 2.5 ? "stretch" : "needs_more_time") as "on_track" | "stretch" | "needs_more_time",
    weeklyTarget: weekly,
    savingStrategy: [
      { title: "Move your surplus first", detail: `Set aside your monthly surplus the day income arrives. Over ${a.deadline} this covers about ₦${n(fromSurplus)}.` },
      { title: "Trim one recurring cost", detail: "Pick your biggest flexible expense (data, subscriptions, eating out) and cut it by a quarter." },
      { title: "Keep goal money separate", detail: "Use a separate savings wallet so it isn’t spent by accident." },
    ],
    opportunities,
    weeklyActions: Array.from({ length: Math.min(weeks, 4) }, (_, i) => ({
      week: i + 1,
      tasks: i === 0
        ? ["Open a separate savings wallet", `Start on: ${lead}`, "Sign up for 2 platforms from the Earn page"]
        : [`Save or earn ₦${n(weekly)} this week`, `Follow up on every offer or application for: ${lead}`, "Review spending and cut one more cost"],
    })),
  };
}

/** Calls Gemini with a timeout, retries on temporary overload (503/429), then tries a lighter model. */
async function askGemini(prompt: string, key: string): Promise<unknown> {
  const primary = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const models = [primary, primary, "gemini-2.5-flash-lite"];
  let last = "";
  for (let i = 0; i < models.length; i++) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${models[i]}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.6 } }),
        signal: AbortSignal.timeout(9000),
      });
      if (res.ok) {
        const json = await res.json();
        return JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
      }
      last = `Gemini ${res.status} (${models[i]})`;
      if (![429, 500, 502, 503, 504].includes(res.status)) break; // not temporary, so don't retry
    } catch (e) {
      last = `${(e as Error).message} (${models[i]})`;
    }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw new Error(last || "Gemini failed");
}

async function handle(req: Request) {
  // 1. Who is calling? Only signed-in users get a plan.
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  // Config problems (missing or malformed key) throw here and are reported by the 500 handler below
  const auth = adminAuth();
  const db = adminDb();

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(token)).uid;
  } catch (err) {
    console.error("[/api/plan] token rejected:", (err as Error).message);
    return NextResponse.json({ error: "Invalid session. Sign in again." }, { status: 401 });
  }
  const ref: DocumentReference = db.collection("users").doc(uid);

  // 2. Read the saved goal and answers from the database. Never trust the request body.
  const data = (await ref.get()).data() as { goal?: Goal; assessment?: Assessment; plan?: unknown; planKey?: string } | undefined;
  if (!data?.goal?.amount || !data.assessment) return NextResponse.json({ error: "Finish the assessment first" }, { status: 400 });
  const { goal, assessment } = data;

  // 3. Same inputs as the saved plan? Reuse it and skip the AI call.
  const key = planKey(goal, assessment);
  if (data.plan && data.planKey === key) return NextResponse.json({ plan: data.plan, source: "saved" });

  // 4. The opportunities always come from our own list (real links, matched to the user's skills).
  //    Gemini only writes the summary, saving advice and weekly steps around them.
  const plan = basePlan(goal, assessment);
  let source = "fallback";
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    const skills = normalizeSkills(assessment.skills, assessment.otherSkill);
    const picked = plan.opportunities.map((o) => o.title);
    const prompt = `You are MindBank's financial planning assistant. The user wants ${goal.amount} Naira for: "${goal.goal}".
Profile: ${JSON.stringify(assessment)}. Skill groups: ${skills.join(", ") || "none given"}.
Their earning opportunities are already chosen: ${JSON.stringify(picked)}. Do not add or rename opportunities.
Write the plan around them. The weekly tasks must name these opportunities and match the user's skills and free time.
Rules: never suggest loans, borrowing, betting, crypto trading or get-rich-quick schemes. Do not promise earnings.
Return ONLY JSON:
{"summary":string,"feasibility":"on_track"|"stretch"|"needs_more_time","weeklyTarget":number,
"savingStrategy":[{"title":string,"detail":string}],
"weeklyActions":[{"week":number,"tasks":[string]}]}
Give 3 saving items and up to 4 weeks of actions with 3 tasks each.`;
    try {
      const p = (await askGemini(prompt, gemini)) as {
        summary?: string; feasibility?: string; weeklyTarget?: number;
        savingStrategy?: typeof plan.savingStrategy; weeklyActions?: typeof plan.weeklyActions;
      };
      if (p?.summary && Array.isArray(p.savingStrategy) && Array.isArray(p.weeklyActions)) {
        plan.summary = String(p.summary);
        if (p.feasibility === "on_track" || p.feasibility === "stretch" || p.feasibility === "needs_more_time") plan.feasibility = p.feasibility;
        if (typeof p.weeklyTarget === "number" && p.weeklyTarget > 0) plan.weeklyTarget = Math.round(p.weeklyTarget);
        plan.savingStrategy = p.savingStrategy;
        plan.weeklyActions = p.weeklyActions;
        source = "gemini";
      }
    } catch (err) {
      console.error("Gemini unavailable, using the built-in plan:", (err as Error).message);
    }
  }

  // 5. Save it so the next visit (on any device) loads instantly
  const clean = JSON.parse(JSON.stringify(plan)); // drops undefined fields (Firestore rejects them)
  await ref.set({ plan: clean, planKey: key, planSource: source, planAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ plan: clean, source });
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    const e = err as { code?: number | string; message?: string };
    const text = String(e?.message ?? "");
    console.error("[/api/plan]", err); // the real cause is in the terminal (local) or the host's function logs (live)

    let code = "UNKNOWN";
    let message = "Something went wrong on the server. Check the logs for details.";
    if (text.startsWith("Missing FIREBASE_")) { code = "ENV_MISSING"; message = `${text}. Add them to the environment variables and redeploy.`; }
    else if (/private key/i.test(text)) { code = "KEY_INVALID"; message = "FIREBASE_PRIVATE_KEY is not valid. Copy it exactly from the downloaded JSON, with \\n between the lines."; }
    else if (e?.code === 5 || /NOT_FOUND/.test(text)) { code = "DB_NOT_FOUND"; message = "Firestore database not found. Create it in the Firebase console (Build → Firestore Database)."; }
    else if (e?.code === 7 || /PERMISSION_DENIED/.test(text)) { code = "DB_PERMISSION"; message = "The service account can't use Firestore. Check the key is from the same project."; }

    // Live site: generic text for visitors plus a short code for you. Local: the full message.
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json({ error: isProd ? "Server error" : message, code }, { status: 500 });
  }
}