CREATE TYPE "public"."PvResetMode" AS ENUM('monthly', 'yearly', 'never');--> statement-breakpoint
ALTER TYPE "public"."PvStatus" ADD VALUE 'cancelled';--> statement-breakpoint
CREATE TABLE "PvCounter" (
	"period" text NOT NULL,
	"code" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "PvCounter_period_code_pk" PRIMARY KEY("period","code")
);
--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "website" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "pvCode" text DEFAULT '45' NOT NULL;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "pvSeqLength" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "pvResetMode" "PvResetMode" DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "Customer" ADD COLUMN "bankName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Customer" ADD COLUMN "bankAccountNumber" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "Customer" ADD COLUMN "bankAccountName" text DEFAULT '' NOT NULL;