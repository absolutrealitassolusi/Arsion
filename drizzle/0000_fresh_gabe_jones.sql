CREATE TYPE "public"."CustomerStatus" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."InvoiceStatus" AS ENUM('draft', 'sent', 'paid');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('info', 'success', 'warning');--> statement-breakpoint
CREATE TYPE "public"."PaymentMethod" AS ENUM('transfer', 'cash', 'cheque');--> statement-breakpoint
CREATE TYPE "public"."ProjectStatus" AS ENUM('ongoing', 'completed', 'on_hold', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."PvDirection" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."PvStatus" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."UserStatus" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."VendorStatus" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "ActivityLog" (
	"id" text PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"detail" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"npwp" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Customer" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"npwp" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text NOT NULL,
	"status" "CustomerStatus" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"invoiceNumber" text NOT NULL,
	"customerName" text NOT NULL,
	"date" timestamp NOT NULL,
	"dueDate" timestamp NOT NULL,
	"items" jsonb NOT NULL,
	"ppnPercent" double precision NOT NULL,
	"subtotal" double precision NOT NULL,
	"ppnAmount" double precision NOT NULL,
	"totalAmount" double precision NOT NULL,
	"poContractNo" text,
	"deliveredTo" text,
	"paidToBankName" text,
	"paidToAccountNumber" text,
	"paidToAccountName" text,
	"notes" text,
	"status" "InvoiceStatus" DEFAULT 'draft' NOT NULL,
	"preparedBy" text NOT NULL,
	"history" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "Invoice_invoiceNumber_unique" UNIQUE("invoiceNumber")
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "NotificationType" NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PaymentVoucher" (
	"id" text PRIMARY KEY NOT NULL,
	"direction" "PvDirection" NOT NULL,
	"date" timestamp NOT NULL,
	"senderBank" text NOT NULL,
	"partyName" text NOT NULL,
	"description" text NOT NULL,
	"items" jsonb NOT NULL,
	"ppnPercent" double precision NOT NULL,
	"pphJasaPercent" double precision NOT NULL,
	"pphFreelancePercent" double precision NOT NULL,
	"subtotal" double precision NOT NULL,
	"ppnAmount" double precision NOT NULL,
	"pphJasaAmount" double precision NOT NULL,
	"pphFreelanceAmount" double precision NOT NULL,
	"totalAmount" double precision NOT NULL,
	"paymentMethod" "PaymentMethod" NOT NULL,
	"receiverBankName" text NOT NULL,
	"receiverAccountName" text NOT NULL,
	"receiverAccountNumber" text NOT NULL,
	"projectNumber" text,
	"poNumber" text,
	"invoiceNumber" text,
	"taxInvoiceNumber" text,
	"attachmentName" text,
	"attachmentUrls" text[] DEFAULT '{}' NOT NULL,
	"status" "PvStatus" DEFAULT 'draft' NOT NULL,
	"preparedBy" text NOT NULL,
	"approvedBy" text,
	"paidBy" text,
	"paymentProofFileName" text,
	"paymentProofUrls" text[] DEFAULT '{}' NOT NULL,
	"taxProofFileName" text,
	"taxProofUrls" text[] DEFAULT '{}' NOT NULL,
	"history" jsonb NOT NULL,
	"preparedSignatureSnapshot" text,
	"approvedSignatureSnapshot" text,
	"paidSignatureSnapshot" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"clientName" text,
	"picName" text,
	"startDate" timestamp,
	"endDate" timestamp,
	"status" "ProjectStatus" DEFAULT 'ongoing' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "Role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "_UserRoles" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_UserRoles_A_B_pk" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"authUserId" text,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"status" "UserStatus" DEFAULT 'active' NOT NULL,
	"lastLogin" timestamp,
	"signatureUrl" text,
	"signatureFileName" text,
	"signatureUpdatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_authUserId_unique" UNIQUE("authUserId")
);
--> statement-breakpoint
CREATE TABLE "Vendor" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"npwp" text NOT NULL,
	"phone" text,
	"address" text NOT NULL,
	"bankName" text NOT NULL,
	"bankAccountNumber" text NOT NULL,
	"bankAccountName" text NOT NULL,
	"status" "VendorStatus" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_A_Role_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_B_User_id_fk" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;