import mongoose from "mongoose";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1"]);

const migrate = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await User.updateMany(
            { onboarded: { $exists: false } },
            {
                $set: {
                    interests: [],
                    interestVector: [],
                    onboarded: false
                }
            }
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} users.`);
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();