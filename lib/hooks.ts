"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { Entry, UserDoc } from "@/lib/db";

/** undefined = still loading, null = no document yet. Updates live. */
export function useUserDoc(uid?: string): UserDoc | null | undefined {
  const [data, setData] = useState<UserDoc | null | undefined>(undefined);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(getDb(), "users", uid),
      (s) => setData(s.exists() ? (s.data() as UserDoc) : null),
      (err) => console.error("users doc:", err), // permission errors mean the rules aren't published yet
    );
  }, [uid]);
  return uid ? data : undefined;
}

/** undefined = still loading. Newest first. */
export function useEntries(uid?: string): Entry[] | undefined {
  const [list, setList] = useState<Entry[] | undefined>(undefined);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      collection(getDb(), "users", uid, "entries"),
      (snap) => setList(snap.docs.map((d) => ({ ...(d.data() as Omit<Entry, "id">), id: d.id })).sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))),
      (err) => console.error("entries:", err),
    );
  }, [uid]);
  return uid ? list : undefined;
}