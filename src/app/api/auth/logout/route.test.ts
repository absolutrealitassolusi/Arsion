import { beforeEach, describe, expect, it, vi } from "vitest";

const signOutMock = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { signOut: signOutMock },
  })),
}));

import { POST } from "./route";

beforeEach(() => {
  signOutMock.mockReset();
});

describe("POST /api/auth/logout", () => {
  it("manggil supabase.auth.signOut() dan balikin pesan sukses", async () => {
    signOutMock.mockResolvedValue({ error: null });

    const res = await POST();
    const body = (await res.json()) as { message: string };

    expect(res.status).toBe(200);
    expect(body.message).toBe("Berhasil logout.");
    expect(signOutMock).toHaveBeenCalledOnce();
  });
});
