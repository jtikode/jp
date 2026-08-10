-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ExpiryItem" DROP CONSTRAINT "ExpiryItem_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ImportBatch" DROP CONSTRAINT "ImportBatch_orgId_fkey";

-- DropForeignKey
ALTER TABLE "IncentiveItem" DROP CONSTRAINT "IncentiveItem_orgId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_orgId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseHistoryItem" DROP CONSTRAINT "PurchaseHistoryItem_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Route" DROP CONSTRAINT "Route_orgId_fkey";

-- DropForeignKey
ALTER TABLE "RouteAssignment" DROP CONSTRAINT "RouteAssignment_orgId_fkey";

-- DropForeignKey
ALTER TABLE "RouteStore" DROP CONSTRAINT "RouteStore_orgId_fkey";

-- DropForeignKey
ALTER TABLE "StockCount" DROP CONSTRAINT "StockCount_orgId_fkey";

-- DropForeignKey
ALTER TABLE "StockItem" DROP CONSTRAINT "StockItem_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Target" DROP CONSTRAINT "Target_orgId_fkey";

-- DropForeignKey
ALTER TABLE "TelecallerLog" DROP CONSTRAINT "TelecallerLog_orgId_fkey";

-- DropForeignKey
ALTER TABLE "TelecallerParty" DROP CONSTRAINT "TelecallerParty_orgId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_orgId_fkey";

-- DropForeignKey
ALTER TABLE "WarehouseTask" DROP CONSTRAINT "WarehouseTask_orgId_fkey";

-- DropForeignKey
ALTER TABLE "WarehouseTaskOccurrence" DROP CONSTRAINT "WarehouseTaskOccurrence_orgId_fkey";

-- DropIndex
DROP INDEX "Route_name_key";

-- DropIndex
DROP INDEX "StockItem_name_key";

-- DropIndex
DROP INDEX "Store_externalCode_key";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ExpiryItem" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ImportBatch" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "IncentiveItem" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseHistoryItem" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RouteAssignment" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RouteStore" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockCount" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockItem" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Target" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TelecallerLog" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TelecallerParty" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Visit" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WarehouseTask" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "WarehouseTaskOccurrence" ALTER COLUMN "orgId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Route_orgId_name_key" ON "Route"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_orgId_name_key" ON "StockItem"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Store_orgId_externalCode_key" ON "Store"("orgId", "externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_orgId_username_key" ON "User"("orgId", "username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStore" ADD CONSTRAINT "RouteStore_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerLog" ADD CONSTRAINT "TelecallerLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTask" ADD CONSTRAINT "WarehouseTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTaskOccurrence" ADD CONSTRAINT "WarehouseTaskOccurrence_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistoryItem" ADD CONSTRAINT "PurchaseHistoryItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncentiveItem" ADD CONSTRAINT "IncentiveItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryItem" ADD CONSTRAINT "ExpiryItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerParty" ADD CONSTRAINT "TelecallerParty_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
