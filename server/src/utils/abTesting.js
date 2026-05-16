function hashUserToVariant(userId, variants = ["A", "B"]) {
    const bucket = userId % variants.length;

    return variants[bucket];
}

function getExperimentConfig(variant) {
    const configs = {
        A: {
            vaultWeight: 0.35,
            aiWeight: 0.25,
            behaviorWeight: 0.15,
            trendWeight: 0.1,
            vendorWeight: 0.15,
        },

        B: {
            vaultWeight: 0.25,
            aiWeight: 0.2,
            behaviorWeight: 0.15,
            trendWeight: 0.1,
            vendorWeight: 0.3,
        },
    };

    return configs[variant] || configs.A;
}

module.exports = {
    hashUserToVariant,
    getExperimentConfig,
};