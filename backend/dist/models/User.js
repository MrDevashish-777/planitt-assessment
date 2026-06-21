"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password_hash: {
        type: String,
        required: true,
    },
    full_name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["ADMIN", "CANDIDATE"],
        default: "CANDIDATE",
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    resume_url: {
        type: String,
        trim: true,
    },
    about: {
        type: String,
        trim: true,
    },
    source: {
        type: String,
        enum: ["ADMIN", "CSV", "GOOGLE_FORM"],
    },
    form_submitted_at: {
        type: Date,
    },
    education_details: {
        type: String,
        trim: true,
    },
    application_status: {
        type: String,
        enum: ["Applied", "Shortlisted", "Interviewing", "Rejected", "Selected"],
        default: "Applied",
    },
    previous_round_results: {
        type: String,
        trim: true,
    },
    skills: {
        type: String,
        trim: true,
    },
    projects: {
        type: String,
        trim: true,
    },
    work_experience: {
        type: String,
        trim: true,
    },
    ai_summary: {
        type: String,
        trim: true,
    },
    ai_questions: {
        type: Array,
        default: [],
    },
    ai_questions_history: {
        type: Array,
        default: [],
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
exports.default = mongoose_1.default.model("User", userSchema);
