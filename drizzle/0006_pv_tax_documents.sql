ALTER TABLE "PaymentVoucher" ADD COLUMN "taxProofs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "PaymentVoucher" ADD COLUMN "withholdingProofs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "PaymentVoucher" ADD COLUMN "taxNote" text;