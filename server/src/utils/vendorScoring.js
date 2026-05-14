function normalizeScore(value, max = 100) {
    return Math.min(value / max, 1);
}

function calculateVendorScore(vendor = {}) {
    const rating =
        normalizeScore(vendor.rating || 0, 5);

    const conversion =
        vendor.conversionRate || 0;

    const reliability =
        vendor.reliabilityScore || 0;

    const quality =
        vendor.qualityScore || 0;

    const trend =
        vendor.trendScore || 0;

    const totalOrders =
        normalizeScore(vendor.totalOrders || 0, 500);

    const score =
        rating * 0.25 +
        conversion * 0.25 +
        reliability * 0.2 +
        quality * 0.15 +
        trend * 0.1 +
        totalOrders * 0.05;

    return Number(score.toFixed(4));
}

function buildVendorInsight(vendor = {}) {
    const insights = [];

    if ((vendor.rating || 0) >= 4.5) {
        insights.push("Highly rated vendor");
    }

    if ((vendor.conversionRate || 0) >= 0.3) {
        insights.push("Strong conversion performance");
    }

    if ((vendor.reliabilityScore || 0) >= 0.8) {
        insights.push("Reliable fulfillment history");
    }

    if ((vendor.trendScore || 0) >= 0.7) {
        insights.push("Trending vendor");
    }

    if (!insights.length) {
        insights.push("Balanced vendor performance");
    }

    return insights;
}

module.exports = {
    calculateVendorScore,
    buildVendorInsight,
};