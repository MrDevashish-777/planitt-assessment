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
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IUser>("User", userSchema);
