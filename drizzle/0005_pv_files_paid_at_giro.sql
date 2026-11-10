ALTER TYPE "public"."PaymentMethod" ADD VALUE 'giro';--> statement-breakpoint
ALTER TABLE "PaymentVoucher" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "PaymentVoucher" ADD COLUMN "paymentProofs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "PaymentVoucher" ADD COLUMN "paidAt" timestamp;--> statement-breakpoint
ALTER TABLE "PaymentVoucher" ADD COLUMN "paymentNote" text;--> statement-breakpoint
-- Isi Tanggal Dibayar PV lama yang sudah dibayar dari entri "paid" terakhir di history.
UPDATE "PaymentVoucher" SET "paidAt" = (SELECT (h->>'at')::timestamp FROM jsonb_array_elements("history") AS h WHERE h->>'status' = 'paid' ORDER BY h->>'at' DESC LIMIT 1) WHERE "status" = 'paid' AND "paidAt" IS NULL;
