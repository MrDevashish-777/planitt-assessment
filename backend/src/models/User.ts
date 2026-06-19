import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password_hash: string;
  full_name: string;
  role: "ADMIN" | "CANDIDATE";
  phone?: string;
  address?: string;
  resume_url?: string;
  about?: string;
  source?: "ADMIN" | "CSV" | "GOOGLE_FORM";
  form_submitted_at?: Date;
  education_details?: string;
  application_status?: "Applied" | "Shortlisted" | "Interviewing" | "Rejected" | "Selected";
  previous_round_results?: string;
  skills?: string;
  projects?: string;
  work_experience?: string;
  ai_summary?: string;
  ai_questions?: Array<{ category: string; question: string }>;
  ai_questions_history?: Array<Array<{ category: string; question: string }>>;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
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
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IUser>("User", userSchema);
