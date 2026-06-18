const prisma = require("../lib/prisma");
const EVENT_TYPES = require("../events/eventTypes");
const { emitEvent } = require("../events/eventEmitter");

function normalize(tag) {
    return tag.toLowerCase().trim();
}

async function updateFromBehavior(userId, product, weight) {
    if (!product?.tags?.length) return;

    const tags = product.tags.map(normalize);

    let profile = await prisma.userProfileAI.findUnique({
        where: { userId },
    });

    if (!profile) {
        await prisma.userProfileAI.create({
            data: {
                userId,
                tags,
                preferenceScore: Object.fromEntries(
                    tags.map((t) => [t, weight])
                ),
            },
        });

        emitEvent(
            EVENT_TYPES.AI_PROFILE_UPDATED,
            { userId }
        );

        return;
    }

    const tagList = profile.tags || [];
    const scores = profile.preferenceScore || {};

    for (const tag of tags) {
        scores[tag] = Math.min((scores[tag] || 0) + weight, 1);

        if (!tagList.includes(tag)) tagList.push(tag);
    }

    await prisma.userProfileAI.update({
        where: { userId },
        data: {
            tags: tagList,
            preferenceScore: scores,
        },
    });

    emitEvent(
        EVENT_TYPES.AI_PROFILE_UPDATED,
        { userId }
    );
}

module.exports = { updateFromBehavior };