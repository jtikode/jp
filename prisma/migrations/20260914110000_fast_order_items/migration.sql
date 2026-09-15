-- CreateTable
CREATE TABLE "FastOrderItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "totalValue" DECIMAL(65,30),
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FastOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FastOrderItem_storeId_idx" ON "FastOrderItem"("storeId");

-- CreateIndex
CREATE INDEX "FastOrderItem_orgId_idx" ON "FastOrderItem"("orgId");

-- AddForeignKey
ALTER TABLE "FastOrderItem" ADD CONSTRAINT "FastOrderItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FastOrderItem" ADD CONSTRAINT "FastOrderItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

