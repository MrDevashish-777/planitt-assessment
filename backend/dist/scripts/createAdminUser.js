"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const db_1 = __importDefault(require("../config/db"));
async function createAdminUser() {
    try {
        await (0, db_1.default)();
        const args = process.argv.slice(2);
        const email = args[0] || "admin@example.com";
        const fullName = args[1] || "Admin User";
        const existingAdmin = await User_1.default.findOne({ email });
        if (existingAdmin) {
            console.log(`⚠️  Admin user with email ${email} already exists`);
            process.exit(0);
        }
        const adminUser = await User_1.default.create({
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
    }
    catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    }
}
createAdminUser();
