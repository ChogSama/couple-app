-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentKey_idx" ON "ExperimentAssignment"("experimentKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_userId_experimentKey_key" ON "ExperimentAssignment"("userId", "experimentKey");

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
