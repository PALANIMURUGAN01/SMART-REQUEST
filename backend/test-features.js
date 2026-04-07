const mongoose = require("mongoose");
require("dotenv").config();
const Request = require("./models/Request");
const Counter = require("./models/Counter");
const User = require("./models/User");

async function createSampleRequest() {
  console.log("Checking for database connectivity...");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected.");

    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
        admin = new User({
            name: "Administrator",
            email: "admin@gmail.com",
            password: "234@",
            role: "admin",
            department: "IT Administration"
        });
        await admin.save();
    }
    
    let counter = await Counter.findOneAndUpdate(
      { id: "request_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const sample = new Request({
      requestId: counter.seq,
      title: "Sample Request Test",
      description: "Test request to verify if Atlas is working correctly.",
      category: "Hardware",
      department: "Hardware",
      priority: "Medium",
      status: "Pending",
      createdBy: admin._id
    });

    await sample.save();
    console.log(`✅ SUCCESS: Sample request created with ID: ${sample.requestId}`);
    
    const all = await Request.find().limit(5);
    console.log("✅ Fetched Requests count:", all.length);

  } catch (err) {
    console.error("❌ FAILED TO CREATE SAMPLE:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSampleRequest();
