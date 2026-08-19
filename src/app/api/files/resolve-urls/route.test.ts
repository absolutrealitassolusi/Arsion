import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
}));
vi.mock("@/lib/file-storage", () => ({
  resolveValues: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { resolveValues } from "@/lib/file-storage";
import { POST } from "./route";

const requireUserMock = vi.mocked(requireUser);
const resolveValuesMock = vi.mocked(resolveValues);

const fakeUser = { id: "u1", name: "Dina Pratiwi", email: "dina@arsion.app", roleNames: ["Admin"], permissions: [] };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/files/resolve-urls", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  requireUserMock.mockReset();
  resolveValuesMock.mockReset();
});

describe("POST /api/files/resolve-urls", () => {
  it("balikin 401 kalau belum login (otorisasi sebelum signed URL dibuat)", async () => {
    const { NextResponse } = await import("next/server");
    requireUserMock.mockResolvedValue({ error: NextResponse.json({ message: "Belum login." }, { status: 401 }) });

    const res = await POST(makeRequest({ paths: ["pv-attachment/u1/x.png"] }));

    expect(res.status).toBe(401);
    expect(resolveValuesMock).not.toHaveBeenCalled();
  });

  it("balikin 400 kalau 'paths' bukan array string/null", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(makeRequest({ paths: [123] }));

    expect(res.status).toBe(400);
  });

  it("sukses: teruskan paths ke resolveValues, balikin hasilnya apa adanya", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });
    resolveValuesMock.mockResolvedValue(["data:image/png;base64,x", null, "https://signed.example/x"]);

    const res = await POST(makeRequest({ paths: ["data:image/png;base64,x", null, "pv-attachment/u1/x.png"] }));
    const body = (await res.json()) as { data: (string | null)[] };

    expect(res.status).toBe(200);
    expect(body.data).toEqual(["data:image/png;base64,x", null, "https://signed.example/x"]);
    expect(resolveValuesMock).toHaveBeenCalledWith(["data:image/png;base64,x", null, "pv-attachment/u1/x.png"]);
  });

  it("balikin 500 dengan pesan jelas kalau resolveValues gagal", async () => {
    requireUserMock.mockResolvedValue({ user: fakeUser });
    resolveValuesMock.mockRejectedValue(new Error("Gagal membuat signed URL: not found"));

    const res = await POST(makeRequest({ paths: ["pv-attachment/u1/missing.png"] }));
    const body = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(body.message).toMatch(/signed URL/i);
  });
});
