/** Stable string for "this goal + these answers". A saved plan is reused only while the key matches. */
const sortKeys = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sortKeys(x)]))
    : v;

export const planKey = (goal: unknown, assessment: unknown) => JSON.stringify(sortKeys({ v: 2, goal, assessment }));