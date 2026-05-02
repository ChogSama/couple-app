function normalize(tag) {
    return tag.toLowerCase().trim();
}

// Safe number conversion
function safe(n) {
    return Number.isFinite(n) ? n : 0;
}

// Get vault score based on tag matches
function getVaultScore(product, vaultTags) {
    if (!vaultTags.length) return 0;

    const user = vaultTags.map(normalize);
    const prod = product.tags.map(normalize);

    const match = prod.filter((t) => user.includes(t)).length;

    return match / (prod.length || 1);
}

// Get AI score based on user profile preferences
function getAIScore(product, profile) {
    if (!profile?.preferenceScore) return 0;

    let score = 0;

    for (const tag of product.tags.map(normalize)) {
        score += profile.preferenceScore[tag] || 0;
    }

    return Math.min(score, 1);
}

module.exports = {
    normalize,
    safe,
    getVaultScore,
    getAIScore,
}