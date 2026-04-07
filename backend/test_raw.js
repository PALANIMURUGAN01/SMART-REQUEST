const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
    const uri = process.env.MONGO_URI;
    console.log("Connecting with MongoClient directly to shards...");
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("✅ MongoClient connected successfully to shards!");
        const db = client.db("mini2_db");
        const collections = await db.listCollections().toArray();
        console.log("✅ Collections found:", collections.map(c => c.name));
    } catch (err) {
        console.error("❌ MongoClient failed:", err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

testConnection();
