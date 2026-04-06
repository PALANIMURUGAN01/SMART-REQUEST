const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mini2_db")
    .then(async () => {
        const staff = await User.find({ role: "staff" });
        console.log(JSON.stringify(staff, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
