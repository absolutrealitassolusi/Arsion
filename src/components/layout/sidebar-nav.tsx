"use client";

import { useNavItems } from "@/hooks/use-nav-items";
import { usePvStatusCounts } from "@/hooks/use-payment-vouchers";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import type { NavItem } from "@/config/nav.config";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function hasBadge(items: NavItem[]): boolean {
  return items.some((item) => Boolean(item.badge) || hasBadge(item.children ?? []));
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const items = useNavItems();
  // Cuma fetch kalau user ini memang bisa lihat menu yang punya angka antrian.
  const { data: counts } = usePvStatusCounts(hasBadge(items));

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map((item) => (
        <SidebarNavItem
          key={item.href ?? item.label}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
          counts={counts}
        />
      ))}
    </nav>
  );
}
