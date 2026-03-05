const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Request = require("../models/Request");
const Counter = require("../models/Counter");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/mini2_db";

async function resetDB() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("Connected 🚀");

        // 1. Delete all requests
        const deleteRes = await Request.deleteMany({});
        console.log(`Deleted ${deleteRes.deletedCount} requests.`);

        // 2. Reset the counter
        const counterRes = await Counter.findOneAndUpdate(
            { id: "request_id" },
            { seq: 0 },
            { upsert: true, new: true }
        );
        console.log("Counter reset successful. Next ID will be 1.");
        console.log("Result:", counterRes);

        process.exit(0);
    } catch (err) {
        console.error("Error resetting database:", err);
        process.exit(1);
    }
}

resetDB();
