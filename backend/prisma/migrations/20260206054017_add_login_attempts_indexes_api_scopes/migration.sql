-- AlterTable
ALTER TABLE "users" ADD COLUMN     "apiKeyScopes" TEXT[] DEFAULT ARRAY['bot:read', 'bot:write']::TEXT[];

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_attempts_email_key" ON "login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_lockedUntil_idx" ON "login_attempts"("lockedUntil");

-- CreateIndex
CREATE INDEX "challenge_habits_habitId_idx" ON "challenge_habits"("habitId");

-- CreateIndex
CREATE INDEX "challenge_progress_userId_idx" ON "challenge_progress"("userId");

-- CreateIndex
CREATE INDEX "challenge_progress_userId_date_idx" ON "challenge_progress"("userId", "date");
