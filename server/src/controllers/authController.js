const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Register a new user
exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Missing required fields",
            });
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash: hashedPassword,
                name,
            },
        });

        return res.status(201).json({
            message: "User created",
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Login a user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        if (!email || !password) {
            return res.status(400).json({
                message: "Missing email or password",
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: "7d" },
        );

        return res.status(200).json({
            accessToken: token,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};