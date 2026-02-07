import mongoose from "mongoose";


import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);

export const connectDB = async () => {
  try {
      const {MONGO_URI} = process.env;
      if (!MONGO_URI) throw new Error("MONGO_URI is not set");

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGO CONNECTED:", conn.connection.host);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
