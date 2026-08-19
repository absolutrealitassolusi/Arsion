import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/dina.json";

/**
 * Login sekali sebagai Dina Pratiwi (role Admin - semua permission) dan
 * simpan cookie sesinya. Test lain (kecuali yang sengaja butuh state
 * logged-out/user lain, lihat login.spec.ts & permission-gating.spec.ts
 * yang override storageState-nya sendiri) pakai session ini biar gak perlu
 * login ulang lewat UI tiap file test.
 */
setup("login sebagai Dina Pratiwi (Admin)", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("dina.pratiwi@arsion.app");
  await page.getByLabel("Password", { exact: true }).fill("Ares@2026");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: authFile });
});
