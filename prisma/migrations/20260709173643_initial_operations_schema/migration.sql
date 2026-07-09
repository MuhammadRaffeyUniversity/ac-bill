-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DISPATCHER', 'DATA_ENTRY', 'TEAM_LEAD', 'PARTNER_VIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('SALARY', 'COMMISSION');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('BOOKED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('SERVICE', 'INSTALL', 'REPAIR');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_RECORDED', 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'NO_CHARGE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpensePaidBy" AS ENUM ('COMPANY', 'TEAM', 'MEMBER', 'PARTNER', 'OWNER');

-- CreateEnum
CREATE TYPE "TeamEntryType" AS ENUM ('COMPLETION', 'PAYMENT', 'EXPENSE', 'NOTE', 'CORRECTION');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "teamId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "compensationType" "CompensationType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultMembers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "serviceAreaTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "teamId" TEXT NOT NULL,
    "role" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "defaultCommissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rawAddress" TEXT NOT NULL,
    "street" TEXT,
    "area" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Malaysia',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "sourcePartnerId" TEXT,
    "assignedTeamId" TEXT,
    "requestedAt" TIMESTAMP(3),
    "timezone" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "unitsCount" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'BOOKED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_RECORDED',
    "priority" TEXT,
    "rawWhatsAppText" TEXT NOT NULL,
    "parsedFields" JSONB,
    "missingFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extractionConfidence" DECIMAL(5,4),
    "scheduledWindowStart" TIMESTAMP(3),
    "scheduledWindowEnd" TIMESTAMP(3),
    "performedAt" TIMESTAMP(3),
    "performed" BOOLEAN,
    "cancellationReason" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobUnit" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "unitLabel" TEXT,
    "acType" TEXT,
    "horsepower" TEXT,
    "issue" TEXT,
    "actionPerformed" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobStatusHistory" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "previousStatus" "JobStatus",
    "nextStatus" "JobStatus" NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSubmittedEntry" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submittedByMemberId" TEXT,
    "enteredByOperatorId" TEXT,
    "jobId" TEXT,
    "rawWhatsAppText" TEXT NOT NULL,
    "entryType" "TeamEntryType" NOT NULL,
    "parsedFields" JSONB,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSubmittedEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "printableToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "collectedByTeam" BOOLEAN NOT NULL DEFAULT false,
    "referenceNumber" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamExpense" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidBy" "ExpensePaidBy" NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyExpense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalExpense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cashIn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cashOut" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "paymentId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "compensationType" "CompensationType" NOT NULL,
    "teamRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "partnerRate" DECIMAL(5,4) NOT NULL DEFAULT 0.25,
    "companyRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionEntry" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "invoiceId" TEXT,
    "teamId" TEXT NOT NULL,
    "partnerId" TEXT,
    "salesAmount" DECIMAL(12,2) NOT NULL,
    "teamAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "partnerAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "companyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expenseAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netCompanyProfit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRecord" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT,
    "teamId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "sales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cash" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expense" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publicDisplayPermission" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- CreateIndex
CREATE INDEX "Team_active_compensationType_idx" ON "Team"("active", "compensationType");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_active_idx" ON "TeamMember"("teamId", "active");

-- CreateIndex
CREATE INDEX "Partner_active_idx" ON "Partner"("active");

-- CreateIndex
CREATE INDEX "Customer_normalizedPhone_idx" ON "Customer"("normalizedPhone");

-- CreateIndex
CREATE INDEX "ServiceAddress_customerId_idx" ON "ServiceAddress"("customerId");

-- CreateIndex
CREATE INDEX "ServiceAddress_area_city_state_idx" ON "ServiceAddress"("area", "city", "state");

-- CreateIndex
CREATE INDEX "Job_status_requestedAt_idx" ON "Job"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "Job_assignedTeamId_requestedAt_idx" ON "Job"("assignedTeamId", "requestedAt");

-- CreateIndex
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");

-- CreateIndex
CREATE INDEX "Job_sourcePartnerId_idx" ON "Job"("sourcePartnerId");

-- CreateIndex
CREATE INDEX "JobUnit_jobId_idx" ON "JobUnit"("jobId");

-- CreateIndex
CREATE INDEX "JobStatusHistory_jobId_createdAt_idx" ON "JobStatusHistory"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "JobStatusHistory_actorId_idx" ON "JobStatusHistory"("actorId");

-- CreateIndex
CREATE INDEX "TeamSubmittedEntry_teamId_entryDate_idx" ON "TeamSubmittedEntry"("teamId", "entryDate");

-- CreateIndex
CREATE INDEX "TeamSubmittedEntry_jobId_idx" ON "TeamSubmittedEntry"("jobId");

-- CreateIndex
CREATE INDEX "TeamSubmittedEntry_reviewStatus_idx" ON "TeamSubmittedEntry"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_jobId_key" ON "Invoice"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_printableToken_key" ON "Invoice"("printableToken");

-- CreateIndex
CREATE INDEX "Invoice_status_issuedAt_idx" ON "Invoice"("status", "issuedAt");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_method_receivedAt_idx" ON "Payment"("method", "receivedAt");

-- CreateIndex
CREATE INDEX "TeamExpense_teamId_date_idx" ON "TeamExpense"("teamId", "date");

-- CreateIndex
CREATE INDEX "TeamExpense_jobId_idx" ON "TeamExpense"("jobId");

-- CreateIndex
CREATE INDEX "TeamExpense_approved_idx" ON "TeamExpense"("approved");

-- CreateIndex
CREATE INDEX "CompanyExpense_date_idx" ON "CompanyExpense"("date");

-- CreateIndex
CREATE INDEX "CompanyExpense_category_idx" ON "CompanyExpense"("category");

-- CreateIndex
CREATE INDEX "PersonalExpense_date_idx" ON "PersonalExpense"("date");

-- CreateIndex
CREATE INDEX "PettyCashEntry_date_idx" ON "PettyCashEntry"("date");

-- CreateIndex
CREATE INDEX "PettyCashEntry_sourceType_sourceId_idx" ON "PettyCashEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "CommissionRule_teamId_effectiveFrom_idx" ON "CommissionRule"("teamId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CommissionRule_compensationType_effectiveFrom_idx" ON "CommissionRule"("compensationType", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionEntry_invoiceId_key" ON "CommissionEntry"("invoiceId");

-- CreateIndex
CREATE INDEX "CommissionEntry_jobId_idx" ON "CommissionEntry"("jobId");

-- CreateIndex
CREATE INDEX "CommissionEntry_teamId_calculatedAt_idx" ON "CommissionEntry"("teamId", "calculatedAt");

-- CreateIndex
CREATE INDEX "CommissionEntry_partnerId_calculatedAt_idx" ON "CommissionEntry"("partnerId", "calculatedAt");

-- CreateIndex
CREATE INDEX "EmployeeRecord_teamMemberId_date_idx" ON "EmployeeRecord"("teamMemberId", "date");

-- CreateIndex
CREATE INDEX "EmployeeRecord_teamId_date_idx" ON "EmployeeRecord"("teamId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_jobId_key" ON "Feedback"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_token_key" ON "Feedback"("token");

-- CreateIndex
CREATE INDEX "Feedback_customerId_idx" ON "Feedback"("customerId");

-- CreateIndex
CREATE INDEX "Feedback_submittedAt_idx" ON "Feedback"("submittedAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAddress" ADD CONSTRAINT "ServiceAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "ServiceAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_sourcePartnerId_fkey" FOREIGN KEY ("sourcePartnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobUnit" ADD CONSTRAINT "JobUnit_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobStatusHistory" ADD CONSTRAINT "JobStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobStatusHistory" ADD CONSTRAINT "JobStatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSubmittedEntry" ADD CONSTRAINT "TeamSubmittedEntry_enteredByOperatorId_fkey" FOREIGN KEY ("enteredByOperatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSubmittedEntry" ADD CONSTRAINT "TeamSubmittedEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSubmittedEntry" ADD CONSTRAINT "TeamSubmittedEntry_submittedByMemberId_fkey" FOREIGN KEY ("submittedByMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSubmittedEntry" ADD CONSTRAINT "TeamSubmittedEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamExpense" ADD CONSTRAINT "TeamExpense_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamExpense" ADD CONSTRAINT "TeamExpense_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCashEntry" ADD CONSTRAINT "PettyCashEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRecord" ADD CONSTRAINT "EmployeeRecord_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
