import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let cached: Auth | null = null;

/**
 * Browser-only. Call this inside effects or event handlers, never during render
 * or at module level, so server prerendering can't crash on missing config.
 */
export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") throw new Error("Firebase Auth is only available in the browser.");
  if (cached) return cached;
  if (!config.apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* variables. Add them to .env.local and restart the dev server.");
  }
  const app = getApps().length ? getApp() : initializeApp(config);
  cached = getAuth(app);
  setPersistence(cached, browserLocalPersistence).catch(() => {}); // keep the session across restarts
  return cached;
}

export const googleProvider = new GoogleAuthProvider(); // safe to create on the server