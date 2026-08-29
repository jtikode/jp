-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "contactPersonName" TEXT;

-- CreateTable
CREATE TABLE "TelecallerCallSchedule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,

    CONSTRAINT "TelecallerCallSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelecallerCallSchedule_routeId_key" ON "TelecallerCallSchedule"("routeId");

-- CreateIndex
CREATE INDEX "TelecallerCallSchedule_orgId_idx" ON "TelecallerCallSchedule"("orgId");

-- CreateIndex
CREATE INDEX "TelecallerCallSchedule_dayOfWeek_idx" ON "TelecallerCallSchedule"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "TelecallerCallSchedule" ADD CONSTRAINT "TelecallerCallSchedule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerCallSchedule" ADD CONSTRAINT "TelecallerCallSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

