-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedMemberId" INTEGER;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedMemberId_fkey" FOREIGN KEY ("assignedMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
