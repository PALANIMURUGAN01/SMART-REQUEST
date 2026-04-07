const { MongoClient } = require('mongodb');
require('dotenv').config();

async function forceCreateDB() {
    const uri = process.env.MONGO_URI;
    console.log("Connecting with MongoClient to FORCE creation...");
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("mini2_db");
        
        // 1. Create Admin User
        console.log("Saving Admin user...");
        await db.collection("users").updateOne(
            { email: "admin@gmail.com" },
            { $set: { 
                name: "Administrator", 
                role: "admin", 
                password: "234@",
                department: "IT Administration",
                createdAt: new Date() 
            }},
            { upsert: true }
        );

        // 2. Clear then Save Test Request
        console.log("Saving Test Request...");
        await db.collection("requests").insertOne({
            requestId: 1,
            title: "Atlas Setup Verified",
            description: "If you see this, your database is finally created and working!",
            status: "Pending",
            priority: "High",
            department: "IT Administration",
            createdAt: new Date()
        });

        // 3. Increment Counter
        await db.collection("counters").updateOne(
            { id: "request_id" },
            { $set: { seq: 1 } },
            { upsert: true }
        );

        console.log("✅ SUCCESS! Check your Atlas Dashboard now. 'mini2_db' is created.");
    } catch (err) {
        console.error("❌ FAILED TO FORCE CREATE:", err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

forceCreateDB();
