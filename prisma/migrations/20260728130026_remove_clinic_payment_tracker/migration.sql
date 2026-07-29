-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SALESMAN', 'TELECALLER', 'WAREHOUSE', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PaymentEntry" DROP CONSTRAINT "PaymentEntry_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentEntry" DROP CONSTRAINT "PaymentEntry_collectedById_fkey";

-- DropTable
DROP TABLE "Clinic";

-- DropTable
DROP TABLE "Patient";

-- DropTable
DROP TABLE "PaymentEntry";

-- DropEnum
DROP TYPE "PaymentType";
