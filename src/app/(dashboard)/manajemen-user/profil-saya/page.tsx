import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/modules/profile/profile-form";
import { ChangePasswordForm } from "@/components/modules/profile/change-password-form";

export default function ProfilSayaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profil Saya" description="Kelola informasi akun Anda." />
      <ProfileForm />
      <ChangePasswordForm />
    </div>
  );
}
