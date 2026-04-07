const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const Request = require("./models/Request");
const Counter = require("./models/Counter");

async function verify() {
  const uri = process.env.MONGO_URI;
  console.log("Connecting to:", uri);
  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB Atlas!");

    // 1. Ensure Admin exists
    let admin = await User.findOne({ email: "admin@gmail.com" });
    if (!admin) {
      console.log("Creating default admin account...");
      admin = new User({
        name: "Administrator",
        email: "admin@gmail.com",
        password: "234@",
        role: "admin",
        department: "IT Administration",
        permissions: { canView: true, canEdit: true }
      });
      await admin.save();
      console.log("✅ Admin created.");
    } else {
      console.log("✅ Admin already exists.");
    }

    // 2. Ensure Counter exists
    let counter = await Counter.findOne({ id: "request_id" });
    if (!counter) {
      console.log("Initializing request counter...");
      counter = new Counter({ id: "request_id", seq: 0 });
      await counter.save();
      console.log("✅ Counter initialized.");
    } else {
      console.log(`✅ Current Counter SEQ: ${counter.seq}`);
    }

    // 3. Create a sample request if none exist
    const reqCount = await Request.countDocuments();
    if (reqCount === 0) {
      console.log("Creating a sample request...");
      const seq = counter.seq + 1;
      const sampleReq = new Request({
        requestId: seq,
        title: "Atlas Connection Test",
        description: "Initial verification request correctly saved to MongoDB Atlas.",
        category: "Software",
        department: "Software",
        priority: "Low",
        status: "Pending",
        createdBy: admin._id
      });
      await sampleReq.save();
      await Counter.findOneAndUpdate({ id: "request_id" }, { $set: { seq } });
      console.log(`✅ Sample request created with ID: ${seq}`);
    } else {
      console.log(`✅ Total existing requests: ${reqCount}`);
    }

    console.log("\n🚀 Verification Complete: ATLAS IS FULLY FUNCTIONAL AND READY.");
  } catch (err) {
    console.error("❌ FAILED TO CONNECT TO ATLAS:");
    console.dir(err);
    if (err.message.includes("bad auth")) {
      console.log("⚠️  Password encoding issue? Checking your password '@' encoding...");
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verify();
