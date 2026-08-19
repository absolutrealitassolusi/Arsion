import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.fn();
const createSignedUrlMock = vi.fn();
const listBucketsMock = vi.fn();
const createBucketMock = vi.fn();
const fromMock = vi.fn(() => ({ upload: uploadMock, createSignedUrl: createSignedUrlMock }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: { from: fromMock, listBuckets: listBucketsMock, createBucket: createBucketMock },
  })),
}));

import {
  isRemotePath,
  validateFile,
  resolveValue,
  resolveValues,
  uploadFile,
  createPrivateBucketIfMissing,
} from "./file-storage";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("isRemotePath", () => {
  it("false buat data URL base64 lama", () => {
    expect(isRemotePath("data:image/png;base64,abcd")).toBe(false);
  });

  it("true buat path Storage baru", () => {
    expect(isRemotePath("pv-attachment/user1/abc.png")).toBe(true);
  });

  it("false buat null/undefined/string kosong", () => {
    expect(isRemotePath(null)).toBe(false);
    expect(isRemotePath(undefined)).toBe(false);
    expect(isRemotePath("")).toBe(false);
  });
});

describe("validateFile", () => {
  it("ok buat PNG di bawah 5MB", () => {
    expect(validateFile({ size: 1024, type: "image/png" })).toEqual({ ok: true });
  });

  it("gagal buat tipe yang gak didukung", () => {
    const result = validateFile({ size: 1024, type: "application/pdf" });
    expect(result.ok).toBe(false);
  });

  it("gagal buat file di atas 5MB", () => {
    const result = validateFile({ size: 6 * 1024 * 1024, type: "image/png" });
    expect(result.ok).toBe(false);
  });
});

describe("resolveValue / resolveValues", () => {
  it("null/undefined -> null, gak manggil client Storage sama sekali", async () => {
    expect(await resolveValue(null)).toBeNull();
    expect(await resolveValue(undefined)).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("data URL lama -> passthrough, gak manggil client Storage sama sekali", async () => {
    const legacy = "data:image/png;base64,abcd";
    expect(await resolveValue(legacy)).toBe(legacy);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("path Storage baru -> createSignedUrl dipanggil, balikin signed URL-nya", async () => {
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://signed.example/abc" }, error: null });

    const result = await resolveValue("pv-attachment/user1/abc.png");

    expect(result).toBe("https://signed.example/abc");
    expect(createSignedUrlMock).toHaveBeenCalledWith("pv-attachment/user1/abc.png", 300);
  });

  it("error dari Supabase pas createSignedUrl -> throw", async () => {
    createSignedUrlMock.mockResolvedValue({ data: null, error: { message: "not found" } });

    await expect(resolveValue("pv-attachment/user1/missing.png")).rejects.toThrow(/signed URL/i);
  });

  it("resolveValues nyampur legacy + path baru + null, urutan tetap sama", async () => {
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://signed.example/x" }, error: null });

    const result = await resolveValues(["data:image/png;base64,x", null, "pv-attachment/u/x.png"]);

    expect(result).toEqual(["data:image/png;base64,x", null, "https://signed.example/x"]);
  });
});

describe("uploadFile", () => {
  const fakeFile = { type: "image/png", arrayBuffer: async () => new ArrayBuffer(8) };

  it("upload sukses -> balikin path dengan struktur {kind}/{ownerId}/{id}.{ext}", async () => {
    uploadMock.mockResolvedValue({ error: null });

    const path = await uploadFile("pv-attachment", "user1", fakeFile);

    expect(path).toMatch(/^pv-attachment\/user1\/[a-z0-9]+\.png$/);
    expect(uploadMock).toHaveBeenCalledWith(path, expect.any(Buffer), { contentType: "image/png", upsert: false });
  });

  it("error dari Supabase pas upload -> throw", async () => {
    uploadMock.mockResolvedValue({ error: { message: "quota exceeded" } });

    await expect(uploadFile("signature", "user1", fakeFile)).rejects.toThrow(/quota exceeded/);
  });
});

describe("createPrivateBucketIfMissing", () => {
  it("bucket belum ada -> dibuat, created: true", async () => {
    listBucketsMock.mockResolvedValue({ data: [], error: null });
    createBucketMock.mockResolvedValue({ error: null });

    const result = await createPrivateBucketIfMissing();

    expect(result).toEqual({ created: true });
    expect(createBucketMock).toHaveBeenCalledWith("pv-files", { public: false });
  });

  it("bucket sudah ada -> dilewati, created: false", async () => {
    listBucketsMock.mockResolvedValue({ data: [{ name: "pv-files" }], error: null });

    const result = await createPrivateBucketIfMissing();

    expect(result).toEqual({ created: false });
    expect(createBucketMock).not.toHaveBeenCalled();
  });
});

describe("konfigurasi belum lengkap", () => {
  it("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY kosong -> error jelas, bukan crash kriptik", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await expect(resolveValue("pv-attachment/u/x.png")).rejects.toThrow(/belum dikonfigurasi/i);
  });
});
