const prisma = require("../lib/prisma");
const { calculateVendorScore, buildVendorInsight } = require("../utils/vendorScoring");

async function enrichProductsWithVendor(products = []) {
    return products.map((product) => {
        const vendor = product.vendor;

        const vendorScore =
            calculateVendorScore(vendor);

        const vendorInsights =
            buildVendorInsight(vendor);

        return {
            ...product,
            vendorIntelligence: {
                vendorId: vendor.id,
                vendorName: vendor.name,
                vendorScore,
                vendorInsights,
                rating: vendor.rating,
                conversionRate:
                    vendor.conversionRate,
                reliabilityScore:
                    vendor.reliabilityScore,
            },
        };
    });
}

async function getTopVendors(limit = 10) {
    const vendors = await prisma.vendor.findMany({
        take: limit,
    });

    return vendors
        .map((vendor) => ({
            ...vendor,
            intelligenceScore:
                calculateVendorScore(vendor),
            insights:
                buildVendorInsight(vendor),
        }))
        .sort(
            (a, b) =>
                b.intelligenceScore -
                a.intelligenceScore
        );
}

module.exports = {
    enrichProductsWithVendor,
    getTopVendors,
};