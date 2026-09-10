
-- AlterTable
ALTER TABLE "review" ADD COLUMN     "commentId" BIGINT,
ADD COLUMN     "error" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "review_repositoryId_prNumber_key" ON "review"("repositoryId", "prNumber");

