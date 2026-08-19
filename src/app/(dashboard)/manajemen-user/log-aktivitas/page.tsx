import { PageHeader } from "@/components/shared/page-header";
import { ActivityLogTable } from "@/components/modules/activity-log/activity-log-table";

export default function LogAktivitasPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Log Aktivitas" description="Riwayat aktivitas pengguna di sistem." />
      <ActivityLogTable />
    </div>
  );
}
