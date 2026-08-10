-- CreateTable
CREATE TABLE "RouteStore" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "visitSequence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RouteStore_routeId_idx" ON "RouteStore"("routeId");

-- CreateIndex
CREATE INDEX "RouteStore_storeId_idx" ON "RouteStore"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStore_routeId_storeId_key" ON "RouteStore"("routeId", "storeId");

-- AddForeignKey
ALTER TABLE "RouteStore" ADD CONSTRAINT "RouteStore_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStore" ADD CONSTRAINT "RouteStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
