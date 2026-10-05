-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "bannerId" TEXT;

-- CreateTable
CREATE TABLE "BannerEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannerEvent_orgId_bannerId_idx" ON "BannerEvent"("orgId", "bannerId");
