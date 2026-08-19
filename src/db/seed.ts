import "dotenv/config";
import { db } from "@/lib/db";
import { roles, users, vendors, customers, paymentVouchers, notifications, company } from "@/db/schema";
import { setUserRoles } from "@/db/user-roles-helpers";
import { dummyUsers } from "@/mocks/data/users";
import { dummyRoles } from "@/mocks/data/roles";
import { dummyVendors } from "@/mocks/data/vendors";
import { dummyCustomers } from "@/mocks/data/customers";
import { dummyPaymentVouchers } from "@/mocks/data/payment-vouchers";
import { dummyNotifications } from "@/mocks/data/notifications";

/** Password sementara buat semua user seed - kasih tau user buat diganti setelah login pertama. */
const SEED_PASSWORD = "Ares@2026";

async function main() {
  console.log("Seeding roles...");
  for (const role of dummyRoles) {
    await db
      .insert(roles)
      .values({ name: role.name, description: role.description, permissions: role.permissions })
      .onConflictDoUpdate({
        target: roles.name,
        set: { description: role.description, permissions: role.permissions },
      });
  }

  console.log("Seeding users...");
  for (const user of dummyUsers) {
    const values = {
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      status: user.status,
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
      signatureUrl: user.signatureUrl,
      signatureFileName: user.signatureFileName,
      signatureUpdatedAt: user.signatureUpdatedAt ? new Date(user.signatureUpdatedAt) : null,
    };
    const [saved] = await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: values.name,
          department: values.department,
          position: values.position,
          status: values.status,
          lastLogin: values.lastLogin,
          signatureUrl: values.signatureUrl,
          signatureFileName: values.signatureFileName,
          signatureUpdatedAt: values.signatureUpdatedAt,
        },
      })
      .returning();
    await setUserRoles(saved!.id, user.roles);
  }

  console.log("Seeding vendors...");
  for (const vendor of dummyVendors) {
    const values = {
      name: vendor.name,
      code: vendor.code,
      npwp: vendor.npwp,
      phone: vendor.phone,
      address: vendor.address,
      bankName: vendor.bankName,
      bankAccountNumber: vendor.bankAccountNumber,
      bankAccountName: vendor.bankAccountName,
      status: vendor.status,
    };
    await db
      .insert(vendors)
      .values(values)
      .onConflictDoUpdate({ target: vendors.code, set: values });
  }

  console.log("Seeding customers...");
  for (const customer of dummyCustomers) {
    const values = {
      name: customer.name,
      code: customer.code,
      npwp: customer.npwp,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status,
    };
    await db
      .insert(customers)
      .values(values)
      .onConflictDoUpdate({ target: customers.code, set: values });
  }

  console.log("Seeding payment vouchers...");
  for (const voucher of dummyPaymentVouchers) {
    const shared = {
      direction: voucher.direction,
      date: new Date(voucher.date),
      senderBank: voucher.senderBank,
      partyName: voucher.partyName,
      description: voucher.description,
      items: voucher.items,
      ppnPercent: voucher.ppnPercent,
      pphJasaPercent: voucher.pphJasaPercent,
      pphFreelancePercent: voucher.pphFreelancePercent,
      subtotal: voucher.subtotal,
      ppnAmount: voucher.ppnAmount,
      pphJasaAmount: voucher.pphJasaAmount,
      pphFreelanceAmount: voucher.pphFreelanceAmount,
      totalAmount: voucher.totalAmount,
      paymentMethod: voucher.paymentMethod,
      receiverBankName: voucher.receiverBankName,
      receiverAccountName: voucher.receiverAccountName,
      receiverAccountNumber: voucher.receiverAccountNumber,
      projectNumber: voucher.projectNumber,
      poNumber: voucher.poNumber,
      invoiceNumber: voucher.invoiceNumber,
      taxInvoiceNumber: voucher.taxInvoiceNumber,
      attachmentName: voucher.attachmentName,
      attachmentUrls: voucher.attachmentUrls ?? [],
      status: voucher.status,
      preparedBy: voucher.preparedBy,
      approvedBy: voucher.approvedBy,
      paidBy: voucher.paidBy,
      paymentProofFileName: voucher.paymentProofFileName,
      paymentProofUrls: voucher.paymentProofUrls ?? [],
      taxProofFileName: voucher.taxProofFileName,
      taxProofUrls: voucher.taxProofUrls ?? [],
      history: voucher.history,
    };
    await db
      .insert(paymentVouchers)
      .values({ voucherNumber: voucher.voucherNumber, ...shared })
      .onConflictDoUpdate({ target: paymentVouchers.voucherNumber, set: shared });
  }

  console.log("Seeding notifications...");
  const existingNotifications = await db.select({ id: notifications.id }).from(notifications).limit(1);
  if (existingNotifications.length === 0) {
    for (const n of dummyNotifications) {
      await db.insert(notifications).values({
        title: n.title,
        description: n.description,
        type: n.type,
        isRead: n.isRead,
        createdAt: new Date(n.createdAt),
      });
    }
  } else {
    console.log("  (dilewati - sudah ada data notifikasi)");
  }

  console.log("Seeding company...");
  const existingCompany = await db.select({ id: company.id }).from(company).limit(1);
  if (existingCompany.length === 0) {
    // npwp/phone/email sengaja dikosongin - belum ada data aslinya, biar
    // diisi user sendiri lewat form Master Data > Company. Cuma dibikin
    // sekali (kalau sudah ada row-nya, gak ditimpa lagi - beda dari
    // Vendor/Customer/dll yang selalu di-upsert ulang tiap seed jalan,
    // soalnya Company bisa udah diedit user lewat form asli).
    await db.insert(company).values({
      name: "PT. Absolut Realitas Solusi",
      address: [
        "Soho Pancoran Tower Splendor Lt. 16 Unit 10 (S-1610)",
        "Jl. MT Haryono Kav. 2-3 Tebet, Pancoran,",
        "Jakarta Selatan 12810",
      ].join("\n"),
      npwp: "",
      phone: "",
      email: "",
    });
  } else {
    console.log("  (dilewati - sudah ada data company)");
  }

  console.log("\nSeed selesai!");
  console.log(
    `Baris "User" tersimpan, tapi belum bisa login - jalankan "npm run auth:migrate-users" buat bikin akun Supabase Auth-nya (akun seed @arsion.app otomatis dapet password "${SEED_PASSWORD}").`
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
