-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "ExpiryItem" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "ImportBatch" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "IncentiveItem" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseHistoryItem" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "RouteAssignment" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "RouteStore" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "StockCount" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "StockItem" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Target" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "TelecallerLog" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "TelecallerParty" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "WarehouseTask" ADD COLUMN     "orgId" TEXT;

-- AlterTable
ALTER TABLE "WarehouseTaskOccurrence" ADD COLUMN     "orgId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Attendance_orgId_idx" ON "Attendance"("orgId");

-- CreateIndex
CREATE INDEX "ExpiryItem_orgId_idx" ON "ExpiryItem"("orgId");

-- CreateIndex
CREATE INDEX "ImportBatch_orgId_idx" ON "ImportBatch"("orgId");

-- CreateIndex
CREATE INDEX "IncentiveItem_orgId_idx" ON "IncentiveItem"("orgId");

-- CreateIndex
CREATE INDEX "LedgerEntry_orgId_idx" ON "LedgerEntry"("orgId");

-- CreateIndex
CREATE INDEX "PurchaseHistoryItem_orgId_idx" ON "PurchaseHistoryItem"("orgId");

-- CreateIndex
CREATE INDEX "Route_orgId_idx" ON "Route"("orgId");

-- CreateIndex
CREATE INDEX "RouteAssignment_orgId_idx" ON "RouteAssignment"("orgId");

-- CreateIndex
CREATE INDEX "RouteStore_orgId_idx" ON "RouteStore"("orgId");

-- CreateIndex
CREATE INDEX "StockCount_orgId_idx" ON "StockCount"("orgId");

-- CreateIndex
CREATE INDEX "StockItem_orgId_idx" ON "StockItem"("orgId");

-- CreateIndex
CREATE INDEX "Store_orgId_idx" ON "Store"("orgId");

-- CreateIndex
CREATE INDEX "Target_orgId_idx" ON "Target"("orgId");

-- CreateIndex
CREATE INDEX "TelecallerLog_orgId_idx" ON "TelecallerLog"("orgId");

-- CreateIndex
CREATE INDEX "TelecallerParty_orgId_idx" ON "TelecallerParty"("orgId");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "Visit_orgId_idx" ON "Visit"("orgId");

-- CreateIndex
CREATE INDEX "WarehouseTask_orgId_idx" ON "WarehouseTask"("orgId");

-- CreateIndex
CREATE INDEX "WarehouseTaskOccurrence_orgId_idx" ON "WarehouseTaskOccurrence"("orgId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStore" ADD CONSTRAINT "RouteStore_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerLog" ADD CONSTRAINT "TelecallerLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTask" ADD CONSTRAINT "WarehouseTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTaskOccurrence" ADD CONSTRAINT "WarehouseTaskOccurrence_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistoryItem" ADD CONSTRAINT "PurchaseHistoryItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncentiveItem" ADD CONSTRAINT "IncentiveItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryItem" ADD CONSTRAINT "ExpiryItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerParty" ADD CONSTRAINT "TelecallerParty_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
