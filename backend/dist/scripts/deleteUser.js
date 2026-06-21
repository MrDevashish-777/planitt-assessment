"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const db_1 = __importDefault(require("../config/db"));
async function deleteUserByEmail(email) {
    try {
        await (0, db_1.default)();
        const result = await User_1.default.deleteOne({ email });
        if (result.deletedCount === 0) {
            console.log(`⚠️  No user found with email: ${email}`);
        }
        else {
            console.log(`✅ User with email ${email} deleted successfully`);
        }
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error deleting user:", error);
        process.exit(1);
    }
}
const emailToDelete = process.argv[2] || "admin@example.com";
deleteUserByEmail(emailToDelete);
