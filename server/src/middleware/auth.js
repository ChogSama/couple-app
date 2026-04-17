const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
module.exports = function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // Check header exists
        if (!authHeader) {
            return res.status(401).json({
                message: "Missing Authorization header",
            });
        }

        // Format: Bearer <token>
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Invalid token format",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user into req
        req.user = {
            userId: decoded.userId,
        };

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
};