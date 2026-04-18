const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const coupleRoutes = require("./routes/couple");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/couple", coupleRoutes);

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});