import { NextResponse } from "next/server";

/* Put these in .env.local:
   GEMINI_API_KEY=your_key
   GEMINI_MODEL=gemini-2.5-flash   (optional) */

type Goal = { amount: string; goal: string };
type Assessment = {
  status: string; income: string; skills: string[]; otherSkill: string;
  expenses: string; savings: string; hours: string; deadline: string;
};

const WEEKS: Record<string, number> = { "1 week": 1, "2 weeks": 2, "1 month": 4, "3 months": 13, "6 months": 26 };

function fallbackPlan(g: Goal, a: Assessment) {
  const target = Number(g.amount || 0);
  const gap = Math.max(target - Number(a.savings || 0), 0);
  const weeks = WEEKS[a.deadline] ?? 4;
  const weekly = Math.ceil(gap / weeks);
  const surplus = Math.max(Number(a.income || 0) - Number(a.expenses || 0), 0);
  const fromSavings = Math.min(Math.round((surplus / 4.3) * weeks), gap);
  const skill = a.skills[0] || a.otherSkill || "your main skill";
  return {
    summary: `You need ${gap.toLocaleString("en-NG")} more in ${a.deadline}. That is about ${weekly.toLocaleString("en-NG")} a week.`,
    feasibility: weekly <= surplus / 4.3 ? "on_track" : weekly <= (surplus / 4.3) * 2.5 ? "stretch" : "needs_more_time",
    weeklyTarget: weekly,
    savingStrategy: [
      { title: "Move your surplus first", detail: `Set aside your monthly surplus the day income arrives. Over ${a.deadline} this covers about ${fromSavings.toLocaleString("en-NG")}.` },
      { title: "Trim one recurring cost", detail: "Pick your biggest flexible expense (data, subscriptions, eating out) and cut it by a quarter." },
      { title: "Keep goal money separate", detail: "Use a separate savings wallet so it isn’t spent by accident." },
    ],
    opportunities: [
      { title: `Freelance ${skill}`, type: "Freelancing", weeklyEstimate: Math.round(weekly * 0.6), effort: "Medium", steps: ["Write a one-line offer", "Share it with 10 people you know", "Apply to 3 listings daily on a freelance platform"] },
      { title: "Paid surveys and microtasks", type: "Microtasks", weeklyEstimate: Math.round(weekly * 0.15), effort: "Low", steps: ["Sign up on 2 well-known platforms", "Complete your profile", "Do tasks in spare 20-minute gaps"] },
      { title: "Sell something you already own", type: "Side income", weeklyEstimate: Math.round(weekly * 0.25), effort: "Low", steps: ["List 5 unused items", "Take clear photos", "Post on marketplaces and status updates"] },
    ],
    weeklyActions: Array.from({ length: Math.min(weeks, 4) }, (_, i) => ({
      week: i + 1,
      tasks: i === 0
        ? ["Open a separate savings wallet", "Send your first offer to 10 people", "Sign up for 2 microtask platforms"]
        : [`Save ${weekly.toLocaleString("en-NG")} this week`, "Follow up on every offer sent", "Review spending and cut one more cost"],
    })),
  };
}

export async function POST(req: Request) {
  let body: { goal: Goal; assessment: Assessment };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { goal, assessment } = body;
  if (!goal?.amount || !assessment) return NextResponse.json({ error: "Missing goal or assessment" }, { status: 400 });

  // TODO: verify the Supabase/Firebase session here. Only signed-in users get a plan.

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ plan: fallbackPlan(goal, assessment), source: "fallback" });

  const prompt = `You are MindBank's financial planning assistant. The user wants ${goal.amount} Naira for: "${goal.goal}".
Profile: ${JSON.stringify(assessment)}.
Rules: never suggest loans, borrowing, betting, crypto trading, or get-rich-quick schemes. Only suggest legitimate ways to earn. Name only well-known platforms. Do not promise earnings; give honest weekly estimates in Naira that fit their skills and free time.
Return ONLY JSON with this shape:
{"summary":string,"feasibility":"on_track"|"stretch"|"needs_more_time","weeklyTarget":number,
"savingStrategy":[{"title":string,"detail":string}],
"opportunities":[{"title":string,"type":string,"weeklyEstimate":number,"effort":"Low"|"Medium"|"High","steps":[string]}],
"weeklyActions":[{"week":number,"tasks":[string]}]}
Give 3 saving items, 3-4 opportunities, and up to 4 weeks of actions.`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ plan: JSON.parse(text), source: "gemini" });
  } catch (err) {
    console.error("plan error", err);
    return NextResponse.json({ plan: fallbackPlan(goal, assessment), source: "fallback" });
  }
}