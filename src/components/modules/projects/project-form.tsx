"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { projectSchema, type ProjectFormValues } from "@/schemas/project.schema";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { useNextMasterCode } from "@/hooks/use-next-master-code";
import type { Project } from "@/types/project";

const statusOptions: { value: ProjectFormValues["status"]; label: string }[] = [
  { value: "ongoing", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "on_hold", label: "Ditahan" },
  { value: "cancelled", label: "Dibatalkan" },
];

interface ProjectFormProps {
  /** Diisi = mode Edit (lihat /master-data/project/[id]/edit). Project yang diarsipkan gak bisa diedit. */
  editProject?: Project;
}

export function ProjectForm({ editProject }: ProjectFormProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(editProject?.id ?? "");
  const nextCode = useNextMasterCode("project", !editProject);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues:
      editProject && editProject.status !== "archived"
        ? {
            name: editProject.name,
            code: editProject.code,
            description: editProject.description ?? "",
            clientName: editProject.clientName ?? "",
            picName: editProject.picName ?? "",
            // Input type="date" butuh "YYYY-MM-DD", API ngirim ISO lengkap.
            startDate: editProject.startDate?.slice(0, 10) ?? "",
            endDate: editProject.endDate?.slice(0, 10) ?? "",
            status: editProject.status,
          }
        : {
            name: "",
            code: "",
            description: "",
            clientName: "",
            picName: "",
            startDate: "",
            endDate: "",
            status: "ongoing",
          },
  });

  // Kode otomatis (+1 dari kode terakhir) - cuma diisi kalau user belum ngetik kode sendiri.
  useEffect(() => {
    if (nextCode.data && !getValues("code")) setValue("code", nextCode.data);
  }, [nextCode.data, getValues, setValue]);

  const isPending = createProject.isPending || updateProject.isPending;

  const onSubmit = (values: ProjectFormValues) => {
    const onSuccess = () => router.push("/master-data/project");
    if (editProject) updateProject.mutate(values, { onSuccess });
    else createProject.mutate(values, { onSuccess });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="name"
            label="Nama Project"
            placeholder="Contoh: Renovasi Gudang Cakung"
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            id="code"
            label="Kode Project"
            placeholder={nextCode.isFetching ? "Memuat kode..." : "Kosongkan untuk kode otomatis"}
            error={errors.code?.message}
            {...register("code")}
          />

          <FormField
            id="clientName"
            label="Nama Klien (Opsional)"
            placeholder="PT Sumber Makmur"
            error={errors.clientName?.message}
            {...register("clientName")}
          />

          <FormField
            id="picName"
            label="PIC (Opsional)"
            placeholder="Nama penanggung jawab project"
            error={errors.picName?.message}
            {...register("picName")}
          />

          <FormField
            id="startDate"
            label="Tanggal Mulai (Opsional)"
            type="date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />

          <FormField
            id="endDate"
            label="Tanggal Selesai (Opsional)"
            type="date"
            error={errors.endDate?.message}
            {...register("endDate")}
          />

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              onValueChange={(value) => setValue("status", value as ProjectFormValues["status"])}
              value={watch("status")}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Ringkasan singkat mengenai project ini"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/master-data/project")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Save className="h-4 w-4" />
              {editProject ? "Simpan Perubahan" : "Simpan Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
