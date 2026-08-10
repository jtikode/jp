-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "workingWithUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_workingWithUserId_fkey" FOREIGN KEY ("workingWithUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
