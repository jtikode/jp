-- AlterTable
ALTER TABLE "User" ADD COLUMN     "promoSlug" TEXT;

-- CreateTable
CREATE TABLE "PromoClick" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PromoClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoClick_userId_idx" ON "PromoClick"("userId");

-- CreateIndex
CREATE INDEX "PromoClick_orgId_idx" ON "PromoClick"("orgId");

-- CreateIndex
CREATE INDEX "PromoClick_orgId_createdAt_idx" ON "PromoClick"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_orgId_promoSlug_key" ON "User"("orgId", "promoSlug");

-- AddForeignKey
ALTER TABLE "PromoClick" ADD CONSTRAINT "PromoClick_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoClick" ADD CONSTRAINT "PromoClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

