"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  UserX,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Power,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteUser, useUpdateUserStatus, useUsers } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { departmentOptions } from "@/mocks/data/departments";
import { formatDateTime } from "@/lib/utils";
import type { User, UserStatus } from "@/types/user";

interface UserTableProps {
  onEdit: (user: User) => void;
}

type SortKey = "name" | "department" | "position" | "status" | "lastLogin";

const PAGE_SIZE = 5;

const statusMap: Record<UserStatus, { label: string; variant: "success" | "secondary" }> = {
  active: { label: "Aktif", variant: "success" },
  inactive: { label: "Nonaktif", variant: "secondary" },
};

/**
 * Sort & pagination di sini murni client-side (data mock cuma sedikit).
 * Search/filter Department/Role/Status dikirim ke mock API lewat useUsers()
 * supaya kontraknya udah siap kalau nanti diganti backend beneran.
 */
export function UserTable({ onEdit }: UserTableProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data, isLoading, isError, error } = useUsers({
    search,
    department: department || undefined,
    role: role || undefined,
    status: (status || undefined) as UserStatus | undefined,
  });
  const { data: rolesData } = useRoles();
  const roleOptions = rolesData?.data.map((r) => r.name) ?? [];
  const deleteUser = useDeleteUser();
  const updateStatus = useUpdateUserStatus();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const sorted = useMemo(() => {
    const list = [...(data?.data ?? [])];
    list.sort((a, b) => {
      const aVal = sortKey === "lastLogin" ? a.lastLogin ?? "" : a[sortKey];
      const bVal = sortKey === "lastLogin" ? b.lastLogin ?? "" : b[sortKey];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const sortableHead = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="flex items-center gap-1.5 hover:text-foreground"
    >
      {label}
      <SortIcon column={key} />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />

        <Select
          value={department || "all"}
          onValueChange={(v) => {
            setDepartment(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Department</SelectItem>
            {departmentOptions.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={role || "all"}
          onValueChange={(v) => {
            setRole(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            {roleOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{sortableHead("name", "Nama")}</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>{sortableHead("department", "Department")}</TableHead>
            <TableHead>{sortableHead("position", "Position")}</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>{sortableHead("status", "Status")}</TableHead>
            <TableHead>{sortableHead("lastLogin", "Last Login")}</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={4} columns={8} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat data user."}
                </TableCell>
              </TableRow>
            )}

            {!isError && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserX className="h-8 w-8" />
                    <p className="text-sm">Tidak ada user ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {paginated.map((user) => {
              const st = statusMap[user.status];
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{user.position}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <Badge key={r} variant="outline">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : "Belum pernah"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/manajemen-user/daftar-user/${user.id}`}>
                            <Eye className="h-4 w-4" /> Lihat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatus.mutate({
                              id: user.id,
                              status: user.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          <Power className="h-4 w-4" />
                          {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus user ini?"
        description={`"${deleteTarget?.name}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteUser.isPending}
      />

      {!isLoading && sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Halaman {currentPage} dari {totalPages} ({sorted.length} user)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
