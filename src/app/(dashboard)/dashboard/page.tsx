import { PageHeader } from "@/components/shared/page-header";
import { DashboardOverview } from "@/components/modules/dashboard/dashboard-overview";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan keuangan dan pembayaran hari ini."
      />
      <DashboardOverview />
    </div>
  );
}
