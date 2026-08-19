import { test, expect } from "@playwright/test";

// Fresh/logged-out context - jangan pakai storageState Dina yang udah login,
// justru mau tes alur login-nya sendiri dari nol.
test.use({ storageState: { cookies: [], origins: [] } });

test("login sukses dengan kredensial yang benar redirect ke /dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("dina.pratiwi@arsion.app");
  await page.getByLabel("Password", { exact: true }).fill("Ares@2026");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
});

test("login gagal dengan password salah nampilin toast error & tetap di /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("dina.pratiwi@arsion.app");
  await page.getByLabel("Password", { exact: true }).fill("password-salah-banget");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText("Email atau password salah.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("halaman dashboard gak bisa diakses tanpa login - redirect balik ke /login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
});
