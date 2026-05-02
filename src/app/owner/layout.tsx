"use client";

import { ToastProvider } from "@/components/admin/Toast";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
