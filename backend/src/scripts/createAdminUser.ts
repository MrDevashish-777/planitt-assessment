import mongoose from "mongoose";
import User from "../models/User";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// Override DNS servers to Google Public DNS to prevent querySrv ECONNREFUSED issues
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("ℹ️ DNS servers overridden to Google Public DNS (8.8.8.8, 8.8.4.4) for MongoDB resolution");
} catch (e: any) {
  console.warn("⚠️ Failed to override process DNS servers:", e.message);
}

async function createAdminUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ Connected to MongoDB");

    const args = process.argv.slice(2);
    const email = args[0] || "admin@example.com";
    const fullName = args[1] || "Admin User";

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  Admin user with email ${email} already exists`);
      process.exit(0);
    }

    const adminUser = await User.create({
      email,
      full_name: fullName,
      password_hash: "admin123", // Placeholder since login checks ADMIN_SHARED_PASSWORD
      role: "ADMIN",
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Full Name: ${adminUser.full_name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`User ID: ${adminUser._id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
