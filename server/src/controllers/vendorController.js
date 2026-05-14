const { getTopVendors } = require("../services/vendorService")

exports.getTopVendors = async (req, res) => {
    try {
        const vendors =
            await getTopVendors();

        return res.status(200).json(vendors);
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};