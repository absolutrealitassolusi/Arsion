"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { formatDateTime } from "@/lib/utils";

/**
 * Read-only - tidak ada tombol Tambah/Edit/Hapus karena log aktivitas
 * otomatis tercatat dari aksi sistem (lihat src/lib/activity-log.ts),
 * bukan diinput manual.
 */
export function ActivityLogTable() {
  const { data, isLoading } = useActivityLogs();
  const logs = data?.data ?? [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Pengguna</TableHead>
          <TableHead>Aktivitas</TableHead>
          <TableHead>Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
              Memuat log aktivitas...
            </TableCell>
          </TableRow>
        )}
        {!isLoading && logs.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
              Belum ada aktivitas tercatat.
            </TableCell>
          </TableRow>
        )}
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
            <TableCell className="font-medium">{log.actor}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell className="text-muted-foreground">{log.detail}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
