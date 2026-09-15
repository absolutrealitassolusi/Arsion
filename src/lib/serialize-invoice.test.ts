import { describe, expect, it } from "vitest";
import { serializeInvoice } from "./serialize-invoice";

function baseInvoice(overrides: Partial<Parameters<typeof serializeInvoice>[0]> = {}) {
  return {
    id: "inv-1",
    invoiceNumber: "INV/2608/0001",
    customerName: "PT Contoh",
    date: new Date("2026-08-01"),
    dueDate: new Date("2026-08-15"),
    items: [{ description: "Item", qty: 1, unitPrice: 1000 }],
    ppnPercent: 11,
    subtotal: 1000,
    ppnAmount: 110,
    totalAmount: 1110,
    poContractNo: null,
    deliveredTo: null,
    paidToBankName: null,
    paidToAccountNumber: null,
    paidToAccountName: null,
    notes: null,
    status: "draft" as const,
    preparedBy: "Vitest",
    history: [],
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
    ...overrides,
  };
}

describe("serializeInvoice - isOverdue", () => {
  it("false kalau statusnya draft, walaupun dueDate sudah lewat", () => {
    const result = serializeInvoice(baseInvoice({ status: "draft", dueDate: new Date("2000-01-01") }));
    expect(result.isOverdue).toBe(false);
  });

  it("false kalau statusnya paid, walaupun dueDate sudah lewat", () => {
    const result = serializeInvoice(baseInvoice({ status: "paid", dueDate: new Date("2000-01-01") }));
    expect(result.isOverdue).toBe(false);
  });

  it("true kalau statusnya sent dan dueDate sudah lewat", () => {
    const result = serializeInvoice(baseInvoice({ status: "sent", dueDate: new Date("2000-01-01") }));
    expect(result.isOverdue).toBe(true);
  });

  it("false kalau statusnya sent tapi dueDate belum lewat", () => {
    const result = serializeInvoice(baseInvoice({ status: "sent", dueDate: new Date("2099-01-01") }));
    expect(result.isOverdue).toBe(false);
  });
});
