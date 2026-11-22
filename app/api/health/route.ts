import { NextResponse } from "next/server";

/**
 * Temporary setup check. Open /api/health on your live site.
 * It reports only true/false and short statuses, never key values.
 * Delete this file once everything works.
 */
export async function GET() {
  const has = (k: string) => !!process.env[k];
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: has("NEXT_PUBLIC_FIREBASE_API_KEY"),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: has("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    FIREBASE_PROJECT_ID: has("FIREBASE_PROJECT_ID"),
    FIREBASE_CLIENT_EMAIL: has("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: has("FIREBASE_PRIVATE_KEY"),
    GEMINI_API_KEY: has("GEMINI_API_KEY"),
  };

  let admin = "ok";
  let firestore = "not checked";
  try {
    const { adminDb } = await import("@/lib/firebaseAdmin"); // a load failure is caught below, not a crash
    const db = adminDb();
    try {
      await db.collection("_health").limit(1).get();
      firestore = "ok";
    } catch (e) {
      const err = e as { code?: number | string; message?: string };
      firestore = err.code === 5 || /NOT_FOUND/.test(err.message ?? "") ? "database not found (create it in the Firebase console)"
        : err.code === 7 || /PERMISSION_DENIED/.test(err.message ?? "") ? "permission denied (key is from a different project?)"
        : "error (see the Vercel logs)";
    }
  } catch (e) {
    const m = (e as Error).message ?? "";
    admin = m.startsWith("Missing FIREBASE_") ? "missing variables"
      : /private key/i.test(m) ? "private key is invalid"
      : /Cannot find module|Failed to load/i.test(m) ? `firebase-admin failed to load: ${m.slice(0, 160)}`
      : `init failed: ${m.slice(0, 160)}`;
  }

  return NextResponse.json({ env, admin, firestore }, { headers: { "Cache-Control": "no-store" } });
}