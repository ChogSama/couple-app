-- DropIndex
DROP INDEX "RecommendationLog_userId_idx";

-- CreateIndex
CREATE INDEX "RecommendationLog_userId_productId_idx" ON "RecommendationLog"("userId", "productId");
