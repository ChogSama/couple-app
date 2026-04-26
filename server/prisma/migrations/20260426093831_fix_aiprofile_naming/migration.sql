/*
  Warnings:

  - You are about to drop the `AIProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AIProfile" DROP CONSTRAINT "AIProfile_userId_fkey";

-- DropTable
DROP TABLE "AIProfile";

-- CreateTable
CREATE TABLE "UserProfileAI" (
    "userId" INTEGER NOT NULL,
    "tags" TEXT[],
    "preferenceScore" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfileAI_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserProfileAI" ADD CONSTRAINT "UserProfileAI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
