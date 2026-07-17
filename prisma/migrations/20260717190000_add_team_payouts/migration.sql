CREATE TYPE "PayoutObligationType" AS ENUM ('SALARY', 'COMMISSION');
CREATE TYPE "PayoutObligationStatus" AS ENUM ('DUE', 'PAID', 'VOID');

ALTER TABLE "Team" ADD COLUMN "monthlySalaryAmount" DECIMAL(12,2);

UPDATE "Team"
SET "monthlySalaryAmount" = 2000.00
WHERE "compensationType" = 'SALARY';

CREATE TABLE "PayoutObligation" (
  "id" TEXT NOT NULL,
  "type" "PayoutObligationType" NOT NULL,
  "status" "PayoutObligationStatus" NOT NULL DEFAULT 'DUE',
  "teamId" TEXT NOT NULL,
  "teamMemberId" TEXT NOT NULL,
  "invoiceId" TEXT,
  "periodKey" TEXT,
  "sourceKey" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayoutObligation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payout" (
  "id" TEXT NOT NULL,
  "obligationId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "referenceNumber" TEXT,
  "note" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutObligation_sourceKey_key" ON "PayoutObligation"("sourceKey");
CREATE INDEX "PayoutObligation_type_status_earnedAt_idx" ON "PayoutObligation"("type", "status", "earnedAt");
CREATE INDEX "PayoutObligation_teamId_periodKey_idx" ON "PayoutObligation"("teamId", "periodKey");
CREATE INDEX "PayoutObligation_teamMemberId_earnedAt_idx" ON "PayoutObligation"("teamMemberId", "earnedAt");
CREATE INDEX "PayoutObligation_invoiceId_idx" ON "PayoutObligation"("invoiceId");
CREATE UNIQUE INDEX "Payout_obligationId_key" ON "Payout"("obligationId");
CREATE INDEX "Payout_recordedById_paidAt_idx" ON "Payout"("recordedById", "paidAt");
CREATE INDEX "Payout_paidAt_idx" ON "Payout"("paidAt");

ALTER TABLE "PayoutObligation"
ADD CONSTRAINT "PayoutObligation_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PayoutObligation"
ADD CONSTRAINT "PayoutObligation_teamMemberId_fkey"
FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PayoutObligation"
ADD CONSTRAINT "PayoutObligation_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payout"
ADD CONSTRAINT "Payout_obligationId_fkey"
FOREIGN KEY ("obligationId") REFERENCES "PayoutObligation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payout"
ADD CONSTRAINT "Payout_recordedById_fkey"
FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
