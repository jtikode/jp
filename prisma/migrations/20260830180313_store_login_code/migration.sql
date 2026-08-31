-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "loginCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_orgId_loginCode_key" ON "Store"("orgId", "loginCode");
