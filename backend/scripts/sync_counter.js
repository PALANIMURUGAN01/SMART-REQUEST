const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Request = require("../models/Request");
const Counter = require("../models/Counter");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/mini2_db";

async function deepSync() {
    try {
        console.log("Connecting to MongoDB for Deep Sync...");
        await mongoose.connect(mongoURI);
        console.log("Connected 🚀");

        // 1. Fetch all requests sorted by creation time
        const requests = await Request.find().sort({ createdAt: 1 });
        console.log(`Found ${requests.length} requests to re-index.`);

        // 2. Re-assign sequential IDs starting from 1
        let counter = 0;
        for (const req of requests) {
            counter++;
            req.requestId = counter;
            await req.save();
            console.log(`Request [${req.title}] re-assigned to ID: ${counter}`);
        }

        // 3. Update the global counter
        const counterRes = await Counter.findOneAndUpdate(
            { id: "request_id" },
            { seq: counter },
            { upsert: true, new: true }
        );

        console.log(`Deep Sync Complete. Counter set to: ${counter}. Next ID will be ${counter + 1}.`);
        process.exit(0);
    } catch (err) {
        console.error("Error during Deep Sync:", err);
        process.exit(1);
    }
}

deepSync();
