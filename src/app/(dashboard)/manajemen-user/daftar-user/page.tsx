"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/modules/users/user-table";
import { UserFormDialog } from "@/components/modules/users/user-form-dialog";
import type { User } from "@/types/user";

export default function DaftarUserPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar User"
        description="Kelola akun pengguna sistem."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah User
          </Button>
        }
      />
      <UserTable onEdit={openEdit} />
      <UserFormDialog open={isDialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </div>
  );
}
