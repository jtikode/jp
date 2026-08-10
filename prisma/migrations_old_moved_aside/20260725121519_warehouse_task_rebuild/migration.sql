/*
  Warnings:

  - You are about to drop the `WarehouseAction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('WEEKLY', 'MONTHLY');

-- DropForeignKey
ALTER TABLE "WarehouseAction" DROP CONSTRAINT "WarehouseAction_userId_fkey";

-- DropTable
DROP TABLE "WarehouseAction";

-- DropEnum
DROP TYPE "WarehouseTaskType";

-- CreateTable
CREATE TABLE "WarehouseTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recurrence" "TaskRecurrence" NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseTaskOccurrence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "originalDate" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,

    CONSTRAINT "WarehouseTaskOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCount" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "recordedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseTaskOccurrence_scheduledDate_idx" ON "WarehouseTaskOccurrence"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTaskOccurrence_taskId_originalDate_key" ON "WarehouseTaskOccurrence"("taskId", "originalDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_name_key" ON "StockItem"("name");

-- CreateIndex
CREATE INDEX "StockCount_date_idx" ON "StockCount"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_stockItemId_date_key" ON "StockCount"("stockItemId", "date");

-- AddForeignKey
ALTER TABLE "WarehouseTaskOccurrence" ADD CONSTRAINT "WarehouseTaskOccurrence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WarehouseTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
