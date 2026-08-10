-- AlterEnum
ALTER TYPE "TaskRecurrence" ADD VALUE 'ONCE';

-- AlterTable
ALTER TABLE "StockItem" ADD COLUMN     "company" TEXT;

-- CreateTable
CREATE TABLE "TelecallerParty" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelecallerParty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelecallerParty_storeId_key" ON "TelecallerParty"("storeId");

-- CreateIndex
CREATE INDEX "StockItem_company_idx" ON "StockItem"("company");

-- AddForeignKey
ALTER TABLE "TelecallerParty" ADD CONSTRAINT "TelecallerParty_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
