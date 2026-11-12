import type { ReactNode } from "react";
import { RequireAuth } from "@/components/AuthProvider";

export default function Layout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}