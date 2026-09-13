-- CreateTable
CREATE TABLE "OrderReminder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReminder_storeId_key" ON "OrderReminder"("storeId");

-- CreateIndex
CREATE INDEX "OrderReminder_orgId_idx" ON "OrderReminder"("orgId");

-- CreateIndex
CREATE INDEX "OrderReminder_active_dayOfWeek_hour_minute_idx" ON "OrderReminder"("active", "dayOfWeek", "hour", "minute");

-- AddForeignKey
ALTER TABLE "OrderReminder" ADD CONSTRAINT "OrderReminder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReminder" ADD CONSTRAINT "OrderReminder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

