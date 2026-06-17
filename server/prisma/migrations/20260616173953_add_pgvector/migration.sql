CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "ProductEmbedding" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductEmbedding_productId_key" ON "ProductEmbedding"("productId");

-- CreateIndex
CREATE INDEX "ProductEmbedding_productId_idx" ON "ProductEmbedding"("productId");

-- AddForeignKey
ALTER TABLE "ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
