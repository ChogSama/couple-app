const prisma = require("../lib/prisma");

exports.getExperimentAssignments =
    async (req, res) => {
        try {
            const assignments =
                await prisma.experimentAssignment.findMany({
                    where: {
                        userId: req.user.userId,
                    },
                });

            return res.status(200).json(assignments);
        } catch (err) {
            return res.status(500).json({
                message: "Internal server error",
                error: err.message,
            });
        }
    };