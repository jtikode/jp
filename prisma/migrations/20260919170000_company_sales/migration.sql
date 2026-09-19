-- CreateTable
CREATE TABLE "CompanySale" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "freeQty" INTEGER NOT NULL DEFAULT 0,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanySale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanySale_orgId_idx" ON "CompanySale"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySale_storeId_company_key" ON "CompanySale"("storeId", "company");

-- AddForeignKey
ALTER TABLE "CompanySale" ADD CONSTRAINT "CompanySale_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySale" ADD CONSTRAINT "CompanySale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

