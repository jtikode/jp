-- CreateTable
CREATE TABLE "ExpiryItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "specialRate" DECIMAL(65,30),
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpiryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpiryItem_expiryDate_idx" ON "ExpiryItem"("expiryDate");
