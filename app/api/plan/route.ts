import { NextResponse } from "next/server";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { planKey } from "@/lib/planKey";
import { buildOpportunities, normalizeSkills } from "@/lib/opportunities";

// export const runtime = "nodejs";

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

export async function POST(req: Request) {
  // 1. Who is calling? Only signed-in users get a plan.
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let uid: string;
  let ref: DocumentReference;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
    ref = adminDb().collection("users").doc(uid);
  } catch (err) {
    console.error("auth error", err);
    const misconfigured = err instanceof Error && err.message.startsWith("Missing FIREBASE_");
    return NextResponse.json({ error: misconfigured ? "Server is not configured" : "Invalid session" }, { status: misconfigured ? 500 : 401 });
  }

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
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": gemini },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.6 } }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const json = await res.json();
      const p = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
      if (p?.summary && Array.isArray(p.savingStrategy) && Array.isArray(p.weeklyActions)) {
        plan.summary = String(p.summary);
        if (["on_track", "stretch", "needs_more_time"].includes(p.feasibility)) plan.feasibility = p.feasibility;
        if (typeof p.weeklyTarget === "number" && p.weeklyTarget > 0) plan.weeklyTarget = Math.round(p.weeklyTarget);
        plan.savingStrategy = p.savingStrategy;
        plan.weeklyActions = p.weeklyActions;
        source = "gemini";
      }
    } catch (err) {
      console.error("plan error", err);
    }
  }

  // 5. Save it so the next visit (on any device) loads instantly
  await ref.set({ plan, planKey: key, planSource: source, planAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ plan, source });
}