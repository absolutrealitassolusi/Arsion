"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { NavItem } from "@/config/nav.config";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

function isPathActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Cek apakah item ini ATAU salah satu keturunannya (anak, cucu, dst) cocok
 * dengan pathname saat ini. Perlu rekursif karena grup nested (misal "PV" di
 * bawah "Finance") sendiri tidak punya href - jadi cek 1 level saja tidak
 * cukup untuk tahu apakah "Finance" harus auto-expand.
 */
function hasActiveDescendant(item: NavItem, pathname: string): boolean {
  if (isPathActive(pathname, item.href)) return true;
  return item.children?.some((child) => hasActiveDescendant(child, pathname)) ?? false;
}

/**
 * Merender satu baris menu. Kalau item.children ada isinya, komponen ini
 * memanggil dirinya sendiri untuk tiap child (rekursif) - lihat penjelasan
 * kenapa ini dipisah dari <SidebarNav /> di pesan chat.
 */
export function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  const pathname = usePathname();
  const hasChildren = Boolean(item.children?.length);
  const isChildActive = hasChildren && item.children!.some((child) => hasActiveDescendant(child, pathname));
  const [isOpen, setIsOpen] = useState(isChildActive);
  const Icon = item.icon;

  // Sidebar gak remount pas pindah halaman (cuma konten yang ganti), jadi
  // isOpen di atas cuma kehitung SEKALI pas mount pertama. Tanpa ini, pindah
  // dari satu grup nested ke grup nested lain (misal PV In -> Tax In) bikin
  // grup lama tetep keliatan kebuka & grup baru gak auto-expand.
  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  if (hasChildren) {
    // Mode collapsed (icon-only): tidak ada ruang untuk expand children,
    // jadi cukup tampilkan ikon + tooltip nama grup (tanpa daftar anaknya).
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center rounded-[10px] py-2.5 text-muted-foreground">
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
            isChildActive
              ? "text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
          />
        </button>

        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
            {item.children!.map((child) => (
              <SidebarNavItem
                key={child.href ?? child.label}
                item={child}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = isPathActive(pathname, item.href);
  const link = (
    <Link
      href={item.href ?? "#"}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {!collapsed && item.label}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
