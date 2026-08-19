import { navItems, type NavItem } from "@/config/nav.config";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * Saring rekursif: leaf item hanya lolos kalau user punya permission-nya.
 * Parent item (punya children) hanya lolos kalau MASIH ADA minimal satu
 * child yang lolos setelah disaring — kalau semua child disembunyikan,
 * parent-nya ikut hilang (daripada nampilin grup kosong yang gak bisa diklik).
 */
function filterByPermission(items: NavItem[], permissions: string[]): NavItem[] {
  return items.reduce<NavItem[]>((visible, item) => {
    if (item.children) {
      const visibleChildren = filterByPermission(item.children, permissions);
      if (visibleChildren.length > 0) {
        visible.push({ ...item, children: visibleChildren });
      }
      return visible;
    }

    if (!item.permission || permissions.includes(item.permission)) {
      visible.push(item);
    }
    return visible;
  }, []);
}

/**
 * `permissions` sudah di-union dari semua role user (dihitung sekali di
 * server, lihat src/lib/current-user.ts) dan tersedia synchronous dari
 * CurrentUserProvider - gak ada loading state/jeda lagi kayak waktu masih
 * fetch Role terpisah lewat useRole().
 */
export function useNavItems(): NavItem[] {
  const { permissions } = useCurrentUser();
  return filterByPermission(navItems, permissions);
}
