-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "routeId" TEXT,
    "visitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "collectionAmount" DECIMAL,
    "orderAmount" DECIMAL,
    "hasOrder" BOOLEAN NOT NULL DEFAULT false,
    "noOrderReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Visit" ("collectionAmount", "createdAt", "hasOrder", "id", "latitude", "longitude", "noOrderReason", "notes", "orderAmount", "photoUrl", "routeId", "storeId", "userId", "visitDate") SELECT "collectionAmount", "createdAt", "hasOrder", "id", "latitude", "longitude", "noOrderReason", "notes", "orderAmount", "photoUrl", "routeId", "storeId", "userId", "visitDate" FROM "Visit";
DROP TABLE "Visit";
ALTER TABLE "new_Visit" RENAME TO "Visit";
CREATE INDEX "Visit_userId_visitDate_idx" ON "Visit"("userId", "visitDate");
CREATE INDEX "Visit_storeId_idx" ON "Visit"("storeId");
CREATE INDEX "Visit_routeId_idx" ON "Visit"("routeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
