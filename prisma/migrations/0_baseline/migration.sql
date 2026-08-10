-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALESMAN', 'TELECALLER', 'WAREHOUSE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('WEEKLY', 'MONTHLY', 'ONCE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('LEAVE', 'HALF_LEAVE', 'ABSENT', 'HOLIDAY_WEEKOFF', 'OFFICE_DAY', 'ON_ROUTE');

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
    "visitSequence" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStore" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "visitSequence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteStore_pkey" PRIMARY KEY ("id")
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
    "hasDiscount" BOOLEAN NOT NULL DEFAULT false,
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
    "routeId" TEXT,
    "workingWithUserId" TEXT,
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
    "paymentPromise" TEXT,
    "collectionAmount" DECIMAL(65,30),
    "hasOrder" BOOLEAN NOT NULL DEFAULT false,
    "noOrderReason" "NoOrderReason",
    "noPaymentReason" TEXT,
    "complaintNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelecallerLog_pkey" PRIMARY KEY ("id")
);

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
    "company" TEXT,
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
    "totalValue" DECIMAL(65,30),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseHistoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncentiveItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "incentiveAmount" DECIMAL(65,30) NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncentiveItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpiryItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "specialRate" DECIMAL(65,30),
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpiryItem_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "TelecallerParty" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelecallerParty_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "RouteStore_routeId_idx" ON "RouteStore"("routeId");

-- CreateIndex
CREATE INDEX "RouteStore_storeId_idx" ON "RouteStore"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStore_routeId_storeId_key" ON "RouteStore"("routeId", "storeId");

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
CREATE INDEX "WarehouseTaskOccurrence_scheduledDate_idx" ON "WarehouseTaskOccurrence"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseTaskOccurrence_taskId_originalDate_key" ON "WarehouseTaskOccurrence"("taskId", "originalDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_name_key" ON "StockItem"("name");

-- CreateIndex
CREATE INDEX "StockItem_company_idx" ON "StockItem"("company");

-- CreateIndex
CREATE INDEX "StockCount_date_idx" ON "StockCount"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_stockItemId_date_key" ON "StockCount"("stockItemId", "date");

-- CreateIndex
CREATE INDEX "LedgerEntry_storeId_idx" ON "LedgerEntry"("storeId");

-- CreateIndex
CREATE INDEX "LedgerEntry_uploadBatchId_idx" ON "LedgerEntry"("uploadBatchId");

-- CreateIndex
CREATE INDEX "PurchaseHistoryItem_storeId_idx" ON "PurchaseHistoryItem"("storeId");

-- CreateIndex
CREATE INDEX "PurchaseHistoryItem_itemName_idx" ON "PurchaseHistoryItem"("itemName");

-- CreateIndex
CREATE INDEX "ExpiryItem_expiryDate_idx" ON "ExpiryItem"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Target_userId_periodMonth_periodYear_key" ON "Target"("userId", "periodMonth", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "TelecallerParty_storeId_key" ON "TelecallerParty"("storeId");

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteAssignment" ADD CONSTRAINT "RouteAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStore" ADD CONSTRAINT "RouteStore_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStore" ADD CONSTRAINT "RouteStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_workingWithUserId_fkey" FOREIGN KEY ("workingWithUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerLog" ADD CONSTRAINT "TelecallerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerLog" ADD CONSTRAINT "TelecallerLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseTaskOccurrence" ADD CONSTRAINT "WarehouseTaskOccurrence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WarehouseTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseHistoryItem" ADD CONSTRAINT "PurchaseHistoryItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerParty" ADD CONSTRAINT "TelecallerParty_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
