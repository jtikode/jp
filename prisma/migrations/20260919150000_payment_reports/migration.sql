-- CreateTable
CREATE TABLE "PaymentReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "invoiceNos" TEXT[],
    "utr" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digestSentAt" TIMESTAMP(3),

    CONSTRAINT "PaymentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentReport_orgId_createdAt_idx" ON "PaymentReport"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentReport_storeId_idx" ON "PaymentReport"("storeId");

-- AddForeignKey
ALTER TABLE "PaymentReport" ADD CONSTRAINT "PaymentReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReport" ADD CONSTRAINT "PaymentReport_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

