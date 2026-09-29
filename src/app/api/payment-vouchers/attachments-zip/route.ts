import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { requirePermission } from "@/lib/api-auth";
import { downloadFile, isRemotePath } from "@/lib/file-storage";
import { PERMISSIONS } from "@/config/permissions";
import type { PvStatus } from "@/types/payment-voucher";

function extensionFromPath(path: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  return match?.[1] ?? "bin";
}

function extensionFromDataUrl(dataUrl: string): string {
  const match = /^data:image\/(png|jpeg|jpg)/.exec(dataUrl);
  const ext = match?.[1];
  if (!ext) return "bin";
  return ext === "jpeg" ? "jpg" : ext;
}

// GET /payment-vouchers/attachments-zip?month=YYYY-MM&status=... - kumpulin
// semua lampiran (attachmentUrls) dari PV yang match filter jadi 1 file ZIP,
// biar gak perlu buka & download lampiran PV satu-satu. Filter month/status
// sengaja SAMA persis kaya yang dipakai voucher-report.tsx.
export async function GET(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.PV_VIEW);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? "";
  const status = searchParams.get("status") as PvStatus | "" | null;

  const rows = await db
    .select({
      id: paymentVouchers.id,
      date: paymentVouchers.date,
      status: paymentVouchers.status,
      attachmentUrls: paymentVouchers.attachmentUrls,
    })
    .from(paymentVouchers)
    .where(status ? eq(paymentVouchers.status, status) : undefined);

  const matching = rows.filter((r) => {
    if (month && r.date.toISOString().slice(0, 7) !== month) return false;
    return true;
  });

  const zip = new JSZip();
  let fileCount = 0;

  for (const voucher of matching) {
    const urls = voucher.attachmentUrls ?? [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]!;
      const suffix = urls.length > 1 ? `_${i + 1}` : "";
      // Anotasi tipe eksplisit sengaja dipasang - tanpa ini TS "aliased
      // narrowing" tetep nganggep cabang else di bawah gak mungkin ke-reach
      // (union-nya cuma string doang, jadi predikat "value is string"
      // bikin sisa cabangnya kesimpulin "never" walau runtime-nya beda).
      const remote: boolean = isRemotePath(url);
      if (remote) {
        const buffer = await downloadFile(url);
        zip.file(`${voucher.id}${suffix}.${extensionFromPath(url)}`, buffer);
      } else if (url.startsWith("data:")) {
        const base64 = url.split(",")[1] ?? "";
        zip.file(`${voucher.id}${suffix}.${extensionFromDataUrl(url)}`, Buffer.from(base64, "base64"));
      } else {
        continue;
      }
      fileCount++;
    }
  }

  if (fileCount === 0) {
    return NextResponse.json({ message: "Tidak ada lampiran pada periode/status ini." }, { status: 404 });
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const fileName = `Lampiran-PV-${month || "semua-periode"}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
