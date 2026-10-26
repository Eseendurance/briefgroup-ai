ALTER TABLE "Workspace"
  ADD COLUMN "customDomainVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "domainVerificationToken" TEXT;

ALTER TABLE "UsageLog"
  ADD COLUMN "creditsUsed" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "WorkspaceUsage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "usedCredits" INTEGER NOT NULL DEFAULT 0,
  "reservedCredits" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceUsage_workspaceId_periodStart_key"
  ON "WorkspaceUsage"("workspaceId", "periodStart");
CREATE INDEX "WorkspaceUsage_workspaceId_periodStart_idx"
  ON "WorkspaceUsage"("workspaceId", "periodStart");
ALTER TABLE "WorkspaceUsage"
  ADD CONSTRAINT "WorkspaceUsage_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
