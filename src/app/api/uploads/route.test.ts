import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
}));
vi.mock("@/lib/file-storage", async () => {
  const actual = await vi.importActual<typeof import("@/lib/file-storage")>("@/lib/file-storage");
  return { ...actual, uploadFile: vi.fn(), validateFile: actual.validateFile };
});

import { requireUser } from "@/lib/api-auth";
import { uploadFile } from "@/lib/file-storage";
import { POST } from "./route";

const requireUserMock = vi.mocked(requireUser);
const uploadFileMock = vi.mocked(uploadFile);

const fakeUser = { id: "u1", name: "Dina Pratiwi", email: "dina@arsion.app", roleNames: ["Admin"], permissions: [] };

function makeRequest(fields: { file?: File; kind?: string }) {
  const formData = new FormData();
  if (fields.file) formData.set("file", fields.file);
  if (fields.kind !== undefined) formData.set("kind", fields.kind);
  return new NextRequest("http://localhost/api/uploads", { method: "POST", body: formData });
}

const pngFile = () => new File([new Uint8Array([1, 2, 3])], "test.png", { type: "image/png" });

beforeEach(() => {
  requireUserMock.mockReset();
  uploadFileMock.mockReset();
});

describe("POST /api/uploads", () => {
  it("balikin 401 kalau belum login", async () => {
    const { NextResponse } = await import("next/server");
    requireUserMock.mockResolvedValue({ error: NextResponse.json({ message: "Belum login." }, { status: 401 }) });

    const res = await POST(makeRequest({ file: pngFile(), kind: "pv-attachment" }));

    expect(res.status).toBe(401);
  });

  it("balikin 400 kalau tidak ada file", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(makeRequest({ kind: "pv-attachment" }));

    expect(res.status).toBe(400);
  });

  it("balikin 400 kalau kind tidak valid", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(makeRequest({ file: pngFile(), kind: "not-a-real-kind" }));

    expect(res.status).toBe(400);
  });

  it("balikin 400 kalau tipe file tidak didukung (validateFile asli, bukan mock)", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });
    const pdfFile = new File([new Uint8Array([1])], "doc.pdf", { type: "application/pdf" });

    const res = await POST(makeRequest({ file: pdfFile, kind: "pv-attachment" }));

    expect(res.status).toBe(400);
  });

  it("sukses: manggil uploadFile dengan kind & userId yang benar, balikin path", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });
    uploadFileMock.mockResolvedValue("pv-attachment/u1/abc.png");

    const res = await POST(makeRequest({ file: pngFile(), kind: "pv-attachment" }));
    const body = (await res.json()) as { data: { path: string } };

    expect(res.status).toBe(201);
    expect(body.data.path).toBe("pv-attachment/u1/abc.png");
    expect(uploadFileMock).toHaveBeenCalledWith("pv-attachment", "u1", expect.anything());
  });

  it("balikin 500 dengan pesan jelas kalau uploadFile gagal (mis. Storage belum dikonfigurasi)", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });
    uploadFileMock.mockRejectedValue(new Error("Supabase Storage belum dikonfigurasi - isi SUPABASE_URL..."));

    const res = await POST(makeRequest({ file: pngFile(), kind: "pv-attachment" }));
    const body = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(body.message).toMatch(/belum dikonfigurasi/i);
  });
});
