function buildHumanExplanation(reasons = []) {
    if (!reasons.length) {
        return "Recommended based on current trends.";
    }

    const top = reasons
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

    return top
        .map((r) => {
            switch (r.type) {
                case "VAULT":
                    return r.message;

                case "AI":
                    return "Matches your interests";

                case "BEHAVIOR":
                    return "Inspired by your previous activity";

                case "TRENDING":
                    return "Trending among couples";

                case "SURPRISE":
                    return "A surprise recommendation";

                default:
                    return r.message;
            }
        })
        .join(" • ");
}

function buildExplainabilityPayload({
    product,
    score,
    explanation,
    source,
}) {
    return {
        productId: product.id,
        finalScore: Number(score.toFixed(4)),
        source,
        explanation,
        explainText: buildHumanExplanation(explanation),
        explainVersion: "v1",
        generatedAt: new Date().toISOString(),
    };
}

module.exports = {
    buildHumanExplanation,
    buildExplainabilityPayload,
};