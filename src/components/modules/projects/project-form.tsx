"use client";

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
import { useCreateProject } from "@/hooks/use-projects";

const statusOptions: { value: ProjectFormValues["status"]; label: string }[] = [
  { value: "ongoing", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "on_hold", label: "Ditahan" },
  { value: "cancelled", label: "Dibatalkan" },
];

export function ProjectForm() {
  const router = useRouter();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
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

  const onSubmit = (values: ProjectFormValues) => {
    createProject.mutate(values, {
      onSuccess: () => router.push("/master-data/project"),
    });
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
            placeholder="RGC-001"
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
            <Button type="submit" isLoading={createProject.isPending}>
              <Save className="h-4 w-4" />
              Simpan Project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
