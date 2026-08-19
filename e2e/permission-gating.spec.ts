import { test, expect } from "@playwright/test";

// Fresh context - login sendiri sebagai Nabila (Staff Finance + GA Officer,
// punya pv.pay tapi TIDAK punya pv.approve), bukan pakai session Dina.
test.use({ storageState: { cookies: [], origins: [] } });

test("user tanpa izin pv.approve gak lihat tombol Approve/Reject", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nabila@arsion.app");
  await page.getByLabel("Password", { exact: true }).fill("Ares@2026");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/finance/approval");

  const firstLink = page.getByRole("link", { name: "Proses →" }).first();
  await expect(firstLink).toBeVisible();
  await firstLink.click();

  await expect(page.getByRole("button", { name: "Approve" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Reject" })).not.toBeVisible();
  await expect(
    page.getByText("Menunggu approval dari user yang punya izin Approve/Reject (kamu tidak punya izin ini).")
  ).toBeVisible();
});
