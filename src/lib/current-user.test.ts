import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

const getUserMock = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
  })),
}));

import { getCurrentUser } from "./current-user";

/** Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`. */
const TEST_EMAIL = "vitest-current-user@example.com";
const TEST_AUTH_USER_ID = "vitest-auth-user-id-12345";

async function seedLinkedUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({
      name: "Vitest Current User",
      email: TEST_EMAIL,
      department: "IT",
      position: "Staff",
      status: "active",
      authUserId: TEST_AUTH_USER_ID,
      ...overrides,
    })
    .returning();
  return user!;
}

beforeEach(() => {
  getUserMock.mockReset();
});

afterEach(async () => {
  await db.delete(users).where(like(users.email, TEST_EMAIL));
});

describe("getCurrentUser", () => {
  it("balikin null kalau gak ada session Supabase", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("balikin null kalau authUserId gak ke-link ke user manapun di DB", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "not-linked-to-anyone" } } });

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("balikin null kalau user-nya nonaktif, meskipun session Supabase valid", async () => {
    await seedLinkedUser({ status: "inactive" });
    getUserMock.mockResolvedValue({ data: { user: { id: TEST_AUTH_USER_ID } } });

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("sukses: resolve CurrentUser dari authUserId, permissions union dari semua role", async () => {
    const seeded = await seedLinkedUser();
    getUserMock.mockResolvedValue({ data: { user: { id: TEST_AUTH_USER_ID } } });

    const result = await getCurrentUser();

    expect(result).not.toBeNull();
    expect(result!.id).toBe(seeded.id);
    expect(result!.name).toBe("Vitest Current User");
    expect(result!.email).toBe(TEST_EMAIL);
    expect(Array.isArray(result!.permissions)).toBe(true);
  });
});
