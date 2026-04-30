function validateNormal(requiredFields) {
    return (req, res, next) => {
        const errors = [];

        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null) {
                errors.push(`${field} is required`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: "Validation error",
                errors,
            });
        }

        next();
    };
}

// Advanced validator (type + format)
function validateAdvanced(rules) {
    return (req, res, next) => {
        const errors = [];

        for (const field in rules) {
            const value = req.body[field];
            const rule = rules[field];

            if (rule.required && (value === undefined || value == null)) {
                errors.push(`${field} is required`);
                continue;
            }

            if (value !== undefined) {
                if (rule.type && typeof value !== rule.type) {
                    errors.push(`${field} must be ${rule.type}`);
                }

                if (rule.minLength && value.length < rule.minLength) {
                    errors.push(`${field} must be at least ${rule.minLength} characters`);
                }

                if (rule.isEmail) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errors.push(`${field} must be a valid email`);
                    }
                }

                if (rule.isBoolean && typeof value !== "boolean") {
                    errors.push(`${field} must be boolean`);
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                message: "Validation error",
                errors,
            });
        }

        next();
    };
}

module.exports = {
    validateNormal,
    validateAdvanced,
};