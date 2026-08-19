"use client";

import Link from "next/link";
import { Boxes, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Sidebar utama (desktop). Bisa di-collapse jadi mode icon-only.
 * State collapse di-manage lewat SidebarContext supaya bisa diakses
 * dari Navbar juga (misalnya tombol toggle di topbar).
 */
export function Sidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen flex-col border-r border-border bg-card transition-[width] duration-200 lg:flex print:hidden",
          isCollapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="truncate text-base font-semibold tracking-tight">Arsion</span>
            )}
          </Link>
        </div>

        <SidebarNav collapsed={isCollapsed} />

        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="icon"
            className="w-full justify-center"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
