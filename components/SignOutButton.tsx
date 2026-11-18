"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <button
      onClick={async () => { await logout(); router.replace("/"); }}
      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/5 hover:text-ink"
    >
      <LogOut size={16} /> Sign out
    </button>
  );
}