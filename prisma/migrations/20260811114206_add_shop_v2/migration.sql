-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HERO', 'OFFER');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "upiPayeeName" TEXT,
ADD COLUMN     "upiVpa" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "mrp" DECIMAL(65,30),
ADD COLUMN     "scheme" TEXT,
ADD COLUMN     "taxPercent" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "ShopBanner" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "placement" "BannerPlacement" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "thresholdAmount" DECIMAL(65,30) NOT NULL,
    "rewardText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestedProduct" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "note" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopBanner_orgId_idx" ON "ShopBanner"("orgId");

-- CreateIndex
CREATE INDEX "LoyaltyTier_orgId_idx" ON "LoyaltyTier"("orgId");

-- CreateIndex
CREATE INDEX "RequestedProduct_orgId_idx" ON "RequestedProduct"("orgId");

-- CreateIndex
CREATE INDEX "RequestedProduct_storeId_idx" ON "RequestedProduct"("storeId");

-- AddForeignKey
ALTER TABLE "ShopBanner" ADD CONSTRAINT "ShopBanner_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedProduct" ADD CONSTRAINT "RequestedProduct_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestedProduct" ADD CONSTRAINT "RequestedProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
