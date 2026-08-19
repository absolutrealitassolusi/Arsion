import { PageHeader } from "@/components/shared/page-header";
import { CompanyForm } from "@/components/modules/company/company-form";

export default function CompanyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Company" description="Identitas perusahaan - dipakai juga di kop surat dokumen cetak." />
      <CompanyForm />
    </div>
  );
}
