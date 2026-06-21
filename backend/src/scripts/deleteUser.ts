import User from "../models/User";
import connectDB from "../config/db";

async function deleteUserByEmail(email: string) {
  try {
    await connectDB();

    const result = await User.deleteOne({ email });

    if (result.deletedCount === 0) {
      console.log(`⚠️  No user found with email: ${email}`);
    } else {
      console.log(`✅ User with email ${email} deleted successfully`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    process.exit(1);
  }
}

const emailToDelete = process.argv[2] || "admin@example.com";
deleteUserByEmail(emailToDelete);
