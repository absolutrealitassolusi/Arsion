import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CurrentUserProvider } from "@/context/current-user-context";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Defense-in-depth di samping src/middleware.ts - middleware sudah nge-gate
  // berdasarkan validitas token, ini mastiin user-nya juga masih ada & aktif.
  if (!user) redirect("/login");

  return (
    <CurrentUserProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </CurrentUserProvider>
  );
}
