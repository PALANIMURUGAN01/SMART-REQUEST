// Override DNS BEFORE anything else - use Google DNS to bypass broken local DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require("mongoose");
require("dotenv").config();

// Use SRV connection string since SRV resolves correctly with Google DNS
const ATLAS_URI = process.env.MONGO_URI || "mongodb+srv://crazyoff234_db_user:Qwert%4012345@cluster0.apze964.mongodb.net/mini2_db?retryWrites=true&w=majority";

async function seedDB() {
  console.log("Connecting with Google DNS override...");
  try {
    await mongoose.connect(ATLAS_URI, { serverSelectionTimeoutMS: 15000 });
    console.log("✅ Connected to Atlas!");

    const db = mongoose.connection.db;

    // Create users collection
    const users = db.collection("users");
    const existingAdmin = await users.findOne({ email: "admin@gmail.com" });
    if (!existingAdmin) {
      await users.insertOne({
        name: "Administrator",
        email: "admin@gmail.com",
        password: "234@",
        role: "admin",
        department: "IT Administration",
        createdAt: new Date()
      });
      console.log("✅ Admin user created.");
    } else {
      console.log("✅ Admin already exists.");
    }

    // Create counters collection
    await db.collection("counters").updateOne(
      { id: "request_id" },
      { $setOnInsert: { id: "request_id", seq: 0 } },
      { upsert: true }
    );
    console.log("✅ Counter initialized.");

    // Create requests collection with one sample
    const requests = db.collection("requests");
    const count = await requests.countDocuments();
    if (count === 0) {
      await requests.insertOne({
        requestId: 1,
        title: "Atlas DB Setup Verified",
        description: "Database successfully created and connected to MongoDB Atlas.",
        status: "Pending",
        priority: "High",
        category: "Software",
        department: "Software",
        createdAt: new Date()
      });
      await db.collection("counters").updateOne({ id: "request_id" }, { $set: { seq: 1 } });
      console.log("✅ Sample request created with ID: 1");
    } else {
      console.log(`✅ ${count} existing requests found.`);
    }

    // Create chats collection placeholder
    const chats = db.collection("chats");
    const chatCount = await chats.countDocuments();
    console.log(`✅ Chats collection ready (${chatCount} chats).`);

    const colls = await db.listCollections().toArray();
    console.log("\n🎉 DONE! Collections in mini2_db:", colls.map(c => c.name).join(", "));
    console.log("✅ Refresh your Atlas Dashboard - mini2_db should now appear!");

  } catch (err) {
    console.error("❌ SEED FAILED:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDB();
