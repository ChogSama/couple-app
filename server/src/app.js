const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const coupleRoutes = require("./routes/couple");
const vaultRoutes = require("./routes/vault");
const recommendRoutes = require("./routes/recommend");
const vendorRoutes = require("./routes/vendor");
const experimentRoutes = require("./routes/experiment");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/couple", coupleRoutes);
app.use("/vault", vaultRoutes);
app.use("/recommend", recommendRoutes);
app.use("/vendor", vendorRoutes);
app.use("/experiment", experimentRoutes);

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});