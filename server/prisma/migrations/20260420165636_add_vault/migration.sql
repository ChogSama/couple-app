/*
  Warnings:

  - Added the required column `requestedById` to the `Relationship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Relationship" ADD COLUMN     "requestedById" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "SecretVault" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "itemType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isVisibleToPartner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretVault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecretVault_ownerId_idx" ON "SecretVault"("ownerId");

-- CreateIndex
CREATE INDEX "SecretVault_itemType_idx" ON "SecretVault"("itemType");

-- AddForeignKey
ALTER TABLE "SecretVault" ADD CONSTRAINT "SecretVault_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
