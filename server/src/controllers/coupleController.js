const { data } = require("react-router-dom");
const prisma = require("../lib/prisma");

// Helper: sort user ids to avoid 2-way duplication
const normalizePair = (a, b) => {
    return a < b ? [a, b] : [b, a];
};

// Send couple request
exports.requestCouple = async (req, res) => {
    try {
        const userId = req.user.userId;
        let { partnerEmail } = req.body;

        if (!partnerEmail) {
            return res.status(400).json({
                message: "Missing partner email",
            });
        }

        // Normalize email
        partnerEmail = partnerEmail.toLowerCase().trim()

        const partner = await prisma.user.findUnique({
            where: { email: partnerEmail },
        });

        if (!partner) {
            return res.status(404).json({
                message: "Partner not found",
            });
        }

        // Anti self request
        if (partner.id === userId) {
            return res.status(400).json({
                message: "Cannot connect to yourself",
            });
        }

        const [user1Id, user2Id] = normalizePair(userId, partner.id);

        // Check existing relationship (2-way)
        const existing = await prisma.relationship.findUnique({
            where: {
                user1Id_user2Id: {
                    user1Id,
                    user2Id,
                },
            },
        });

        if (existing) {
            return res.status(400).json({
                message: `Relationship already exists (${existing.status})`,
            });
        }

        const relationship = await prisma.relationship.create({
            data: {
                user1Id,
                user2Id,
                status: "PENDING",
            },
        });

        return res.status(200).json({
            message: "Request sent",
            data: relationship,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Accept couple request
exports.acceptCouple = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { relationshipId } = req.body;

        if (!relationshipId) {
            return res.status(400).json({
                message: "Missing relationship id",
            });
        }

        const relationship = await prisma.relationship.findUnique({
            where: {
                id: Number(relationshipId),
            },
        });

        if (!relationship) {
            return res.status(404).json({
                message: "Relationship not found",
            });
        }

        // Only user2 (the person to whom the request was sent) will accept
        if (relationship.user2Id !== userId) {
            return res.status(403).json({
                message: "Not authorized to accept this request",
            });
        }

        if (relationship.status !== "PENDING") {
            return res.status(400).json({
                message: "Relationship is not pending",
            });
        }

        const updated = await prisma.relationship.update({
            where: { id: relationship.id },
            data: {
                status: "CONNECTED",
            },
        });

        return res.status(200).json({
            message: "Connected",
            data: updated,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get relationship
exports.getMyRelationship = async (req, res) => {
    try {
        const userId = req.user.userId;

        const relationships = await prisma.relationship.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId },
                ],
            },
            include: {
                user1: {
                    select: { id: true, email: true, name: true },
                },
                user2: {
                    select: { id: true, email: true, name: true },
                },
            },
        });

        return res.status(200).json({
            data: relationships,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};