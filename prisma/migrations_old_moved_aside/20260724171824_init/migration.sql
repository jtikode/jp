-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALESMAN', 'TELECALLER', 'WAREHOUSE', 'ADMIN');

-- CreateEnum
CREATE TYPE "WarehouseTaskType" AS ENUM ('INWARD', 'SHELVING', 'FULFILLMENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('LEAVE', 'HALF_LEAVE', 'ABSENT', 'HOLIDAY_WEEKOFF', 'OFFICE_DAY');

-- CreateEnum
CREATE TYPE "NoOrderReason" AS ENUM ('STORE_CLOSED', 'NO_STOCK_NEEDED', 'OWNER_NOT_AVAILABLE', 'PAYMENT_DISPUTE', 'COMPETITOR_STOCKED', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "RouteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "externalCode" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "routeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "routeId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "collectionAmount" DECIMAL(65,30),
    "orderAmount" DECIMAL(65,30),
    "hasOrder" BOOLEAN NOT NULL DEFAULT false,
    "noOrderReason" "NoOrderReason",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelecallerLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "contactDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderAmount" DECIMAL(65,30),
    "paymentPromise" DECIMAL(65,30),
    "collectionAmount" DECIMAL(65,30),
    "hasOrder" BOOLEAN NOT NULL DEFAULT false,
    "noOrderReason" "NoOrderReason",
    "noPaymentReason" TEXT,
    "complaintNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelecallerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskType" "WarehouseTaskType" NOT NULL,
    "referenceNo" TEXT,
    "itemDescription" TEXT,
    "quantity" INTEGER,
    "rackLocation" TEXT,
    "hasDiscrepancy" BOOLEAN NOT NULL DEFAULT false,
    "discrepancyNotes" TEXT,
    "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "invoiceNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "amount" DECIMAL(65,30) NOT NULL,
    "outstandingAmount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseHistoryItem" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseHistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "monthlyTarget" DECIMAL(65,30) NOT NULL,
    "todayTarget" DECIMAL(65,30) NOT NULL,
    "perRetailerTarget" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "importType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Route_name_key" ON "Route"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RouteAssignment_userId_routeId_key" ON "RouteAssignment"("userId", "routeId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_externalCode_key" ON "Store"("externalCode");

-- CreateIndex
CREATE INDEX "Store_routeId_idx" ON "Store"("routeId");

-- CreateIndex
CREATE INDEX "Store_name_idx" ON "Store"("name");

-- CreateIndex
CREATE INDEX "Visit_userId_visitDate_idx" ON "Visit"("userId", "visitDate");

-- CreateIndex
CREATE INDEX "Visit_storeId_idx" ON "Visit"("storeId");

-- CreateIndex
CREATE INDEX "Visit_routeId_idx" ON "Visit"("routeId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE INDEX "TelecallerLog_userId_contactDate_idx" ON "TelecallerLog"("userId", "contactDate");

-- CreateIndex
CREATE INDEX "TelecallerLog_storeId_idx" ON "TelecallerLog"("storeId");

-- CreateIndex
CREATE INDEX "WarehouseAction_userId_actionDate_idx" ON "WarehouseAction"("userId", "actionDate");

-- CreateIndex
CREATE INDEX "WarehouseAction_taskType_idx" ON "WarehouseAction"("taskType");

-- CreateIndex
CREATE INDEX "WarehouseAction_hasDiscrepancy_idx" ON "WarehouseAction"("hasDiscrepancy");

-- CreateIndex
CREATE INDEX "LedgerEntry_storeId_idx" ON "LedgerEntry"("storeId");

-- CreateIndex
CREATE INDEX "LedgerEntry_uploadBatchId_idx" ON "LedgerEntry"("uploadBatchId");

-- CreateIndex
CREATE INDEX "PurchaseHistoryItem_storeId_idx" ON "PurchaseHistoryItem"("storeId");

-- CreateIndex
CREATE INDEX "PurchaseHistoryItem_itemName_idx" ON "PurchaseHistoryItem"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "Target_userId_periodMonth_periodYear_key" ON "Target"("userId", "periodMonth", "periodYear");

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerLog" ADD CONSTRAINT "TelecallerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerLog" ADD CONSTRAINT "TelecallerLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseAction" ADD CONSTRAINT "WarehouseAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistoryItem" ADD CONSTRAINT "PurchaseHistoryItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
