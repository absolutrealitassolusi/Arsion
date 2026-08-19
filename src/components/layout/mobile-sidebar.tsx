"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function MobileSidebar() {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="p-0">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold tracking-tight">Arsion</span>
          </Link>
        </div>
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
