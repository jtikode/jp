-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "dealId" TEXT;

-- CreateTable
CREATE TABLE "WednesdayDeal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dealPrice" DECIMAL(65,30) NOT NULL,
    "maxQtyPerStore" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WednesdayDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WednesdayDeal_productId_key" ON "WednesdayDeal"("productId");

-- CreateIndex
CREATE INDEX "WednesdayDeal_orgId_idx" ON "WednesdayDeal"("orgId");

-- CreateIndex
CREATE INDEX "OrderItem_dealId_idx" ON "OrderItem"("dealId");

-- AddForeignKey
ALTER TABLE "WednesdayDeal" ADD CONSTRAINT "WednesdayDeal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WednesdayDeal" ADD CONSTRAINT "WednesdayDeal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "WednesdayDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

