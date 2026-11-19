import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function app() {
  if (getApps().length) return getApps()[0];
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");
  }
  const privateKey = FIREBASE_PRIVATE_KEY.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  if (!privateKey.includes("BEGIN PRIVATE KEY")) throw new Error("FIREBASE_PRIVATE_KEY is missing its BEGIN PRIVATE KEY header (invalid private key)");
  return initializeApp({
    credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey }),
  });
}
export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());