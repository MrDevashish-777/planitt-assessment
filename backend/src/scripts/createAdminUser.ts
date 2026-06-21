import User from "../models/User";
import connectDB from "../config/db";

async function createAdminUser() {
  try {
    await connectDB();

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
