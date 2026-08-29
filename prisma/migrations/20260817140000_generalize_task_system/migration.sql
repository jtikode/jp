-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "TaskRecurrence" ADD VALUE 'DAILY';

-- DropForeignKey
ALTER TABLE "WarehouseTask" DROP CONSTRAINT "WarehouseTask_orgId_fkey";

-- DropForeignKey
ALTER TABLE "WarehouseTaskOccurrence" DROP CONSTRAINT "WarehouseTaskOccurrence_orgId_fkey";

-- DropForeignKey
ALTER TABLE "WarehouseTaskOccurrence" DROP CONSTRAINT "WarehouseTaskOccurrence_taskId_fkey";

-- DropTable
DROP TABLE "WarehouseTask";

-- DropTable
DROP TABLE "WarehouseTaskOccurrence";

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recurrence" "TaskRecurrence" NOT NULL,
    "scheduledTime" TEXT,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "assignedToId" TEXT,
    "assignedRole" "Role",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskOccurrence" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "originalDate" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,

    CONSTRAINT "TaskOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_orgId_idx" ON "Task"("orgId");

-- CreateIndex
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

-- CreateIndex
CREATE INDEX "TaskOccurrence_scheduledDate_idx" ON "TaskOccurrence"("scheduledDate");

-- CreateIndex
CREATE INDEX "TaskOccurrence_orgId_idx" ON "TaskOccurrence"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskOccurrence_taskId_originalDate_key" ON "TaskOccurrence"("taskId", "originalDate");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskOccurrence" ADD CONSTRAINT "TaskOccurrence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

