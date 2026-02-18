-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'TOGGLED');

-- CreateTable
CREATE TABLE "feature_flag_audits" (
    "id" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_flag_audits_flagKey_idx" ON "feature_flag_audits"("flagKey");

-- CreateIndex
CREATE INDEX "feature_flag_audits_performedBy_idx" ON "feature_flag_audits"("performedBy");

-- CreateIndex
CREATE INDEX "feature_flag_audits_createdAt_idx" ON "feature_flag_audits"("createdAt");

-- AddForeignKey
ALTER TABLE "feature_flag_audits" ADD CONSTRAINT "feature_flag_audits_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
