const prisma = require("../lib/prisma");

// Placeholder: OpenAI / local model integration
async function generateEmbedding(text) {
    // TODO: Replace with OpenAI embeddings
    return Array(1536).fill(0).map(() => Math.random());
}

async function storeProductEmbedding(productId, text) {
    const embedding = await generateEmbedding(text);

    return prisma.productEmbedding.upsert({
        where: { productId },
        update: { embedding },
        create: {
            productId,
            embedding,
        },
    });
}

module.exports = {
    generateEmbedding,
    storeProductEmbedding,
};