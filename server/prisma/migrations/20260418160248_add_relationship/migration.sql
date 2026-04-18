-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('PENDING', 'CONNECTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Relationship" (
    "id" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relationship_user1Id_idx" ON "Relationship"("user1Id");

-- CreateIndex
CREATE INDEX "Relationship_user2Id_idx" ON "Relationship"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_user1Id_user2Id_key" ON "Relationship"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
