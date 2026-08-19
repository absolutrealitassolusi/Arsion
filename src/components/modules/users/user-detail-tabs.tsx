"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, PenTool, Upload, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useUser, useUpdateUserSignature } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { useUploadDataUrls } from "@/hooks/use-file-upload";
import { useResolvedFileUrl } from "@/hooks/use-resolved-file-urls";
import { getErrorMessage } from "@/lib/axios";
import { PERMISSION_GROUPS } from "@/config/permissions";
import { formatDateTime } from "@/lib/utils";
import type { UserStatus } from "@/types/user";

const ALLOWED_SIGNATURE_TYPES = ["image/png", "image/jpeg"];

const statusMap: Record<UserStatus, { label: string; variant: "success" | "secondary" }> = {
  active: { label: "Aktif", variant: "success" },
  inactive: { label: "Nonaktif", variant: "secondary" },
};

const tabs = [
  { key: "personal", label: "Personal Information" },
  { key: "employment", label: "Employment Information" },
  { key: "roles", label: "Roles" },
  { key: "permissions", label: "Permissions" },
  { key: "signature", label: "Signature" },
  { key: "activity", label: "Activity Log" },
];

interface UserDetailTabsProps {
  userId: string;
}

export function UserDetailTabs({ userId }: UserDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const { data, isLoading } = useUser(userId);
  const { data: rolesData } = useRoles();
  const updateSignature = useUpdateUserSignature(userId);
  const uploadSignature = useUploadDataUrls();

  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [pendingSignature, setPendingSignature] = useState<{ url: string; fileName: string } | null>(null);
  const [removeSignatureOpen, setRemoveSignatureOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  const user = data?.data;
  const resolvedSignatureUrl = useResolvedFileUrl(user?.signatureUrl);
  const { data: activityLogsData, isLoading: isActivityLoading } = useActivityLogs(user?.name, {
    enabled: Boolean(user?.name),
  });

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_SIGNATURE_TYPES.includes(file.type)) {
      toast.error("Format file harus PNG, JPG, atau JPEG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingSignature({ url: reader.result as string, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = async () => {
    if (!pendingSignature) return;
    try {
      const [path] = await uploadSignature.mutateAsync({
        dataUrls: [pendingSignature.url],
        kind: "signature",
        baseName: pendingSignature.fileName,
      });
      updateSignature.mutate(
        { signatureUrl: path!, signatureFileName: pendingSignature.fileName },
        { onSuccess: () => setPendingSignature(null) }
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal upload tanda tangan - coba lagi."));
    }
  };

  const handleRemoveSignature = () => {
    updateSignature.mutate(
      { signatureUrl: null, signatureFileName: null },
      { onSuccess: () => setRemoveSignatureOpen(false) }
    );
  };

  // Kanvas di-setup ulang tiap kali mode gambar dibuka - resolusi disesuaikan
  // devicePixelRatio biar garisnya tidak buram di layar retina, lalu diberi
  // latar putih (bukan transparan) supaya kelihatan seperti kertas.
  useEffect(() => {
    if (!drawMode) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setHasDrawing(false);
  }, [drawMode]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawing) setHasDrawing(true);
  };

  const handleCanvasPointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasDrawing(false);
  };

  const handleSaveDrawnSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasDrawing) return;
    const fileName = `tanda-tangan-${Date.now()}.png`;
    try {
      const [path] = await uploadSignature.mutateAsync({
        dataUrls: [canvas.toDataURL("image/png")],
        kind: "signature",
        baseName: fileName,
      });
      updateSignature.mutate(
        { signatureUrl: path!, signatureFileName: fileName },
        { onSuccess: () => setDrawMode(false) }
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal upload tanda tangan - coba lagi."));
    }
  };

  // Permission "inherited" = gabungan (union) permission dari semua role yang
  // dimiliki user - dihitung dari data Role asli, bukan disimpan terpisah.
  const inheritedPermissions = useMemo(() => {
    if (!user || !rolesData) return new Set<string>();
    const assignedRoles = rolesData.data.filter((r) => user.roles.includes(r.name));
    return new Set(assignedRoles.flatMap((r) => r.permissions));
  }, [user, rolesData]);


  if (isLoading || !user) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Memuat data user...
        </CardContent>
      </Card>
    );
  }

  const status = statusMap[user.status];

  return (
    <>
      <Card>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="px-6" />
        <CardContent className="pt-6">
          {activeTab === "personal" && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Nama Lengkap</dt>
                <dd className="text-sm font-medium">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-sm font-medium">{user.email}</dd>
              </div>
            </dl>
          )}

          {activeTab === "employment" && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Department</dt>
                <dd className="text-sm font-medium">{user.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Position</dt>
                <dd className="text-sm font-medium">{user.position}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd><Badge variant={status.variant}>{status.label}</Badge></dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last Login</dt>
                <dd className="text-sm font-medium">
                  {user.lastLogin ? formatDateTime(user.lastLogin) : "Belum pernah"}
                </dd>
              </div>
            </dl>
          )}

          {activeTab === "roles" && (
            <div className="flex flex-wrap gap-2">
              {user.roles.length === 0 && (
                <p className="text-sm text-muted-foreground">User ini belum punya role.</p>
              )}
              {user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Permission di bawah ini otomatis dihitung dari gabungan role yang dimiliki user
                ({user.roles.join(", ") || "-"}) - bukan diatur satu-satu per user.
              </p>
              {PERMISSION_GROUPS.map((group) => {
                const groupPerms = group.permissions.filter((p) => inheritedPermissions.has(p.key));
                if (groupPerms.length === 0) return null;
                return (
                  <div key={group.label} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {groupPerms.map((perm) => (
                        <div key={perm.key} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success" />
                          {perm.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {inheritedPermissions.size === 0 && (
                <p className="text-sm text-muted-foreground">
                  User ini belum punya permission apa pun (belum ada role, atau role-nya belum punya permission).
                </p>
              )}
            </div>
          )}

          {activeTab === "signature" && (
            <div className="space-y-4">
              <input
                ref={signatureFileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleSignatureFileChange}
              />

              {drawMode ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Gambar Tanda Tangan</p>
                  <canvas
                    ref={signatureCanvasRef}
                    className="h-40 w-full touch-none rounded-[10px] border border-border bg-white"
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
                  />
                  <p className="text-xs text-muted-foreground">
                    Gambar pakai mouse, trackpad, atau jari (kalau di layar sentuh).
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      isLoading={updateSignature.isPending || uploadSignature.isPending}
                      disabled={!hasDrawing}
                      onClick={handleSaveDrawnSignature}
                    >
                      <Save className="h-4 w-4" />
                      Simpan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!hasDrawing || updateSignature.isPending || uploadSignature.isPending}
                      onClick={handleClearCanvas}
                    >
                      Bersihkan
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={updateSignature.isPending || uploadSignature.isPending}
                      onClick={() => setDrawMode(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : pendingSignature ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Preview Tanda Tangan Baru</p>
                  <div className="flex h-40 items-center justify-center rounded-[10px] border border-border bg-secondary/40 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingSignature.url}
                      alt="Preview tanda tangan"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{pendingSignature.fileName}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      isLoading={updateSignature.isPending || uploadSignature.isPending}
                      onClick={handleSaveSignature}
                    >
                      <Save className="h-4 w-4" />
                      Simpan
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={updateSignature.isPending || uploadSignature.isPending}
                      onClick={() => setPendingSignature(null)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : user.signatureUrl ? (
                <div className="space-y-3">
                  <div className="flex h-40 items-center justify-center rounded-[10px] border border-border bg-secondary/40 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolvedSignatureUrl.data ?? undefined}
                      alt={`Tanda tangan ${user.name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>{user.signatureFileName}</p>
                    {user.signatureUpdatedAt && <p>Diperbarui {formatDateTime(user.signatureUpdatedAt)}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => signatureFileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      Upload File Baru
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDrawMode(true)}>
                      <PenTool className="h-4 w-4" />
                      Gambar Ulang
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => setRemoveSignatureOpen(true)}>
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-input bg-background text-sm text-muted-foreground">
                  <PenTool className="h-6 w-6" />
                  <span className="font-medium">Belum ada tanda tangan</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => signatureFileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Upload File
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDrawMode(true)}>
                      <PenTool className="h-4 w-4" />
                      Gambar Sendiri
                    </Button>
                  </div>
                  <span className="text-xs">Upload: PNG, JPG, atau JPEG</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isActivityLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      Memuat log aktivitas...
                    </TableCell>
                  </TableRow>
                )}
                {!isActivityLoading && (activityLogsData?.data.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      Belum ada aktivitas tercatat untuk user ini.
                    </TableCell>
                  </TableRow>
                )}
                {activityLogsData?.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">{log.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removeSignatureOpen}
        onOpenChange={setRemoveSignatureOpen}
        title="Hapus tanda tangan ini?"
        description={`Tanda tangan ${user.name} akan dihapus. User bisa upload ulang kapan saja.`}
        confirmLabel="Hapus"
        isLoading={updateSignature.isPending}
        onConfirm={handleRemoveSignature}
      />
    </>
  );
}
