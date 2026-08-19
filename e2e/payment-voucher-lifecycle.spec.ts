import { test, expect } from "@playwright/test";

/**
 * Pakai storageState default project (login sebagai Dina Pratiwi/Admin dari
 * auth.setup.ts) - jadi langsung mulai dalam keadaan sudah login.
 *
 * PENTING: test ini bikin data beneran di database dev (gak ada DB test
 * terpisah) - PV yang dibuat DIHAPUS lagi di akhir test biar gak numpuk.
 */
test("PV lifecycle penuh: buat -> ajukan -> approve -> tandai dibayar", async ({ page }) => {
  await page.goto("/finance/pv/pv-out/create");

  await page.getByLabel("Bank Pengirim").click();
  await page.getByRole("option", { name: "BRI - Rekening Operasional" }).click();

  // Pilih vendor yang SUDAH ada di data seed (PT Sumber Makmur) - jangan
  // ngetik nama baru, supaya gak ikut bikin record Vendor baru yang harus
  // dibersihin juga.
  const partyInput = page.getByPlaceholder("Ketik nama vendor...");
  await partyInput.click();
  await partyInput.fill("Sumber");
  await page.getByText("PT Sumber Makmur", { exact: true }).click();

  await page.getByPlaceholder("Keterangan item...").fill("Item testing E2E");
  // Urutan number input di form: [0] qty (biarin default 1), [1] harga satuan item.
  await page.locator('input[type="number"]').nth(1).fill("500000");

  await page.getByPlaceholder("Contoh: Pembayaran invoice #INV-2231").fill("Test E2E lifecycle PV");

  await page.getByRole("button", { name: "Ajukan untuk Approval" }).click();

  // "Ajukan untuk Approval" bikin PV (POST) lalu langsung submit (PATCH)
  // sebelum redirect ke halaman detail - regex-nya sengaja nge-exclude
  // "create" literal, soalnya "create" sendiri kebetulan cocok pola
  // [a-zA-Z0-9]+ dan bikin assertion ini lolos duluan sebelum redirect
  // beneran kejadian (voucherId ke-capture salah kalau kejadian).
  await expect(page).toHaveURL(/\/finance\/pv\/pv-out\/(?!create$)[a-zA-Z0-9]+$/);
  const voucherId = page.url().split("/").pop()!;

  try {
    await page.getByRole("button", { name: "Approval" }).click();
    await page.getByRole("button", { name: "Approve" }).click();
    await page.getByRole("button", { name: "Setujui" }).click();
    // .last() sengaja, bukan .first() - dokumen PaymentVoucherPrint (yang
    // disembunyikan lewat class "hidden" di luar mode print) ditaruh paling
    // atas di DOM dan juga punya teks persis "Disetujui" (label tanda
    // tangan), jadi kalau .first() bakal ke-match ke situ, bukan ke Badge
    // status yang keliatan.
    await expect(page.getByText("Disetujui", { exact: true }).last()).toBeVisible();

    await page.getByRole("button", { name: "Payment" }).click();
    await page.getByRole("button", { name: "Tandai Sudah Dibayar" }).click();
    await page.getByRole("button", { name: "Tandai Dibayar" }).click();
    await expect(page.getByText("Dibayar", { exact: true }).last()).toBeVisible();
  } finally {
    const response = await page.request.delete(`/api/payment-vouchers/${voucherId}`);
    expect(response.ok()).toBeTruthy();
  }
});
