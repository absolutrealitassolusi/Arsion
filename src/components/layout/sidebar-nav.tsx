"use client";

import { useNavItems } from "@/hooks/use-nav-items";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const items = useNavItems();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map((item) => (
        <SidebarNavItem
          key={item.href ?? item.label}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
