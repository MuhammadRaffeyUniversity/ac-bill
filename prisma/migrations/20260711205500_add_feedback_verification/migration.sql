ALTER TABLE "Feedback"
ADD COLUMN "paidAmount" DECIMAL(12,2),
ADD COLUMN "paymentMethod" "PaymentMethod",
ADD COLUMN "acCooling" BOOLEAN;
