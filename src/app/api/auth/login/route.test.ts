import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, activityLogs } from "@/db/schema";

const signInWithPasswordMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { signInWithPassword: signInWithPasswordMock, signOut: signOutMock },
  })),
}));

import { POST } from "./route";

const TEST_EMAIL = "vitest-login-route@example.com";
const TEST_AUTH_USER_ID = "vitest-login-auth-user-id";

async function seedUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({
      name: "Vitest Login User",
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

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  signInWithPasswordMock.mockReset();
  signOutMock.mockReset();
});

afterEach(async () => {
  await db.delete(users).where(like(users.email, TEST_EMAIL));
  await db.delete(activityLogs).where(like(activityLogs.actor, "Vitest Login User"));
});

describe("POST /api/auth/login", () => {
  it("balikin 400 kalau body gak valid", async () => {
    const res = await POST(makeRequest({ email: "bukan-email", password: "123" }));

    expect(res.status).toBe(400);
  });

  it("balikin 401 kalau Supabase Auth nolak kredensialnya", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });

    const res = await POST(makeRequest({ email: TEST_EMAIL, password: "salahbanget" }));

    expect(res.status).toBe(401);
  });

  it("balikin 401 & signOut kalau authUserId gak ke-link ke user manapun di DB", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: "auth-id-tanpa-user-row" } }, error: null });

    const res = await POST(makeRequest({ email: "siapa@example.com", password: "password123" }));

    expect(res.status).toBe(401);
    expect(signOutMock).toHaveBeenCalled();
  });

  it("balikin 401 & signOut kalau user-nya nonaktif walau kredensial Supabase valid", async () => {
    await seedUser({ status: "inactive" });
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: TEST_AUTH_USER_ID } }, error: null });

    const res = await POST(makeRequest({ email: TEST_EMAIL, password: "password123" }));

    expect(res.status).toBe(401);
    expect(signOutMock).toHaveBeenCalled();
  });

  it("sukses: balikin {data:{email}}, update lastLogin, catat activity log", async () => {
    await seedUser();
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: TEST_AUTH_USER_ID } }, error: null });

    const res = await POST(makeRequest({ email: TEST_EMAIL, password: "password123" }));
    const body = (await res.json()) as { data: { email: string } };

    expect(res.status).toBe(200);
    expect(body.data.email).toBe(TEST_EMAIL);

    const [after] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
    expect(after!.lastLogin).not.toBeNull();

    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.actor, "Vitest Login User")).limit(1);
    expect(log?.action).toBe("Login");
  });
});
