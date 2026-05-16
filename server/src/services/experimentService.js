const prisma = require("../lib/prisma");
const { hashUserToVariant } = require("../utils/abTesting");

async function assignUserToExperiment(
    userId,
    experimentKey
) {
    const existing =
        await prisma.experimentAssignment.findUnique({
            where: {
                userId_experimentKey: {
                    userId,
                    experimentKey,
                },
            },
        });

    if (existing) {
        return existing;
    }

    const variant =
        hashUserToVariant(userId);

    return prisma.experimentAssignment.create({
        data: {
            userId,
            experimentKey,
            variant,
        },
    });
}

module.exports = {
    assignUserToExperiment,
}