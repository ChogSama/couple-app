-- AlterTable
ALTER TABLE "RecommendationLog" ADD COLUMN     "context" JSONB,
ADD COLUMN     "isClicked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPurchased" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AIProfile" (
    "userId" INTEGER NOT NULL,
    "tags" TEXT[],
    "preferenceScore" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Product_tags_idx" ON "Product" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "RecommendationLog_source_idx" ON "RecommendationLog"("source");

-- AddForeignKey
ALTER TABLE "AIProfile" ADD CONSTRAINT "AIProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
