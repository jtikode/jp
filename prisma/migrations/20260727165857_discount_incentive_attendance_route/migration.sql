-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'ON_ROUTE';

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "routeId" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "hasDiscount" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "IncentiveItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "incentiveAmount" DECIMAL(65,30) NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncentiveItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
