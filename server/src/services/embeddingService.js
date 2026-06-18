const prisma = require("../lib/prisma");

// Placeholder: OpenAI / local model integration
async function generateEmbedding(text) {
    // TODO: Replace with OpenAI embeddings
    const arr = Array(1536).fill(0);

    for (let i = 0; i < text.length; i++) {
        arr[i % 1536] += text.charCodeAt(i) / 255;
    }

    return arr;
}

async function storeProductEmbedding(productId, text) {
    const embedding = await generateEmbedding(text);
    const vector = `[${embedding.join(",")}]`;

    await prisma.$executeRawUnsafe(`
        INSERT INTO "ProductEmbedding"
            ("productId", "embedding")
        VALUES
            (${productId}, '${vector}'::vector)
        ON CONFLICT ("productId")
        DO UPDATE SET
            embedding = EXCLUDED.embedding
        `);

    return true;
}

module.exports = {
    generateEmbedding,
    storeProductEmbedding,
};