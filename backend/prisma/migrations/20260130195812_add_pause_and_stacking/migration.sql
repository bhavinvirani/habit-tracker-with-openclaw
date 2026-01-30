-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pauseReason" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedUntil" TIMESTAMP(3),
ADD COLUMN     "stackedAfterHabitId" TEXT;

-- CreateIndex
CREATE INDEX "habits_stackedAfterHabitId_idx" ON "habits"("stackedAfterHabitId");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_stackedAfterHabitId_fkey" FOREIGN KEY ("stackedAfterHabitId") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
