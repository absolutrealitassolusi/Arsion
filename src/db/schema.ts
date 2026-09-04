import { pgTable, pgEnum, text, timestamp, boolean, doublePrecision, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { PaymentVoucherItem, PaymentVoucherHistoryEntry } from "@/types/payment-voucher";
import type { InvoiceItem, InvoiceHistoryEntry } from "@/types/invoice";

export const userStatusEnum = pgEnum("UserStatus", ["active", "inactive"]);
export const vendorStatusEnum = pgEnum("VendorStatus", ["active", "inactive"]);
export const customerStatusEnum = pgEnum("CustomerStatus", ["active", "inactive"]);
export const projectStatusEnum = pgEnum("ProjectStatus", ["ongoing", "completed", "on_hold", "cancelled"]);
export const pvDirectionEnum = pgEnum("PvDirection", ["in", "out"]);
export const pvStatusEnum = pgEnum("PvStatus", ["draft", "submitted", "approved", "rejected", "paid"]);
export const paymentMethodEnum = pgEnum("PaymentMethod", ["transfer", "cash", "cheque"]);
export const notificationTypeEnum = pgEnum("NotificationType", ["info", "success", "warning"]);
export const invoiceStatusEnum = pgEnum("InvoiceStatus", ["draft", "sent", "paid"]);

export const users = pgTable("User", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // Link ke auth.users.id (UUID) di Supabase Auth - dipakai buat resolve
  // identitas login (lihat src/lib/current-user.ts). users.id (cuid)
  // sendiri TETAP jadi PK, gak diganti, supaya _UserRoles & referensi lain
  // gak perlu disentuh.
  authUserId: text("authUserId").unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  lastLogin: timestamp("lastLogin"),
  signatureUrl: text("signatureUrl"),
  signatureFileName: text("signatureFileName"),
  signatureUpdatedAt: timestamp("signatureUpdatedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const roles = pgTable("Role", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  permissions: text("permissions").array().notNull().default([]),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

// Join table matching Prisma's implicit many-to-many convention exactly
// (table name `_UserRoles`, columns "A" -> Role.id, "B" -> User.id, composite PK).
export const userRoles = pgTable(
  "_UserRoles",
  {
    roleId: text("A").notNull().references(() => roles.id, { onDelete: "cascade" }),
    userId: text("B").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.userId] })]
);

export const usersRelations = relations(users, ({ many }) => ({ userRoles: many(userRoles) }));
export const rolesRelations = relations(roles, ({ many }) => ({ userRoles: many(userRoles) }));
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const vendors = pgTable("Vendor", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  npwp: text("npwp").notNull(),
  phone: text("phone"),
  address: text("address").notNull(),
  bankName: text("bankName").notNull(),
  bankAccountNumber: text("bankAccountNumber").notNull(),
  bankAccountName: text("bankAccountName").notNull(),
  status: vendorStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const customers = pgTable("Customer", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  npwp: text("npwp").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address").notNull(),
  status: customerStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const projects = pgTable("Project", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  clientName: text("clientName"),
  picName: text("picName"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: projectStatusEnum("status").notNull().default("ongoing"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const paymentVouchers = pgTable("PaymentVoucher", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  voucherNumber: text("voucherNumber").notNull().unique(),
  direction: pvDirectionEnum("direction").notNull(),
  date: timestamp("date").notNull(),
  senderBank: text("senderBank").notNull(),
  partyName: text("partyName").notNull(),
  description: text("description").notNull(),
  items: jsonb("items").$type<PaymentVoucherItem[]>().notNull(),
  ppnPercent: doublePrecision("ppnPercent").notNull(),
  pphJasaPercent: doublePrecision("pphJasaPercent").notNull(),
  pphFreelancePercent: doublePrecision("pphFreelancePercent").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  ppnAmount: doublePrecision("ppnAmount").notNull(),
  pphJasaAmount: doublePrecision("pphJasaAmount").notNull(),
  pphFreelanceAmount: doublePrecision("pphFreelanceAmount").notNull(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  receiverBankName: text("receiverBankName").notNull(),
  receiverAccountName: text("receiverAccountName").notNull(),
  receiverAccountNumber: text("receiverAccountNumber").notNull(),
  projectNumber: text("projectNumber"),
  poNumber: text("poNumber"),
  invoiceNumber: text("invoiceNumber"),
  taxInvoiceNumber: text("taxInvoiceNumber"),
  attachmentName: text("attachmentName"),
  attachmentUrls: text("attachmentUrls").array().notNull().default([]),
  status: pvStatusEnum("status").notNull().default("draft"),
  preparedBy: text("preparedBy").notNull(),
  approvedBy: text("approvedBy"),
  paidBy: text("paidBy"),
  paymentProofFileName: text("paymentProofFileName"),
  paymentProofUrls: text("paymentProofUrls").array().notNull().default([]),
  taxProofFileName: text("taxProofFileName"),
  taxProofUrls: text("taxProofUrls").array().notNull().default([]),
  history: jsonb("history").$type<PaymentVoucherHistoryEntry[]>().notNull(),
  // Salinan User.signatureUrl PERSIS di momen status berubah (bukan referensi
  // live) - supaya kalau user ganti tanda tangannya belakangan, dokumen yang
  // sudah Dibuat/Disetujui/Dibayarkan gak ikut berubah retroaktif. Null buat
  // baris lama (dari sebelum kolom ini ada) - fallback ke lookup live di
  // payment-voucher-print.tsx buat kasus itu, lihat src/types/user.ts.
  preparedSignatureSnapshot: text("preparedSignatureSnapshot"),
  approvedSignatureSnapshot: text("approvedSignatureSnapshot"),
  paidSignatureSnapshot: text("paidSignatureSnapshot"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const invoices = pgTable("Invoice", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  invoiceNumber: text("invoiceNumber").notNull().unique(),
  customerName: text("customerName").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  items: jsonb("items").$type<InvoiceItem[]>().notNull(),
  ppnPercent: doublePrecision("ppnPercent").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  ppnAmount: doublePrecision("ppnAmount").notNull(),
  totalAmount: doublePrecision("totalAmount").notNull(),
  notes: text("notes"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  preparedBy: text("preparedBy").notNull(),
  history: jsonb("history").$type<InvoiceHistoryEntry[]>().notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const notifications = pgTable("Notification", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: notificationTypeEnum("type").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

/** Singleton - cuma ada 1 row, gak ada "list" atau "[id]" - lihat src/app/api/company/route.ts. */
export const company = pgTable("Company", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  address: text("address").notNull(),
  npwp: text("npwp").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

/**
 * Catatan aktivitas sistem - read-only, ditulis otomatis dari kode (lihat
 * src/lib/activity-log.ts), gak pernah diinput manual. `actor` disimpan
 * sebagai nama (bukan FK ke User.id) - konsisten sama pola preparedBy/
 * approvedBy/paidBy di PaymentVoucher, dan tetap kebaca meskipun user-nya
 * kehapus belakangan.
 */
export const activityLogs = pgTable("ActivityLog", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
