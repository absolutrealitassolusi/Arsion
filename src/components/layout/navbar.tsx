"use client";

import { Menu, Search } from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";

export function Navbar() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 print:hidden">
      <div className="flex flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Buka menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari data, produk, invoice..." className="pl-9" />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationDropdown />
        <ThemeToggle />
        <ProfileDropdown />
      </div>
    </header>
  );
}
