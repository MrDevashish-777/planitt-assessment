import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInterview extends Document {
  candidate_id: Types.ObjectId;
  interviewer_id: Types.ObjectId;
  ratings: {
    technical_knowledge: number;
    communication_skills: number;
    problem_solving: number;
    confidence: number;
    overall_performance: number;
  };
  overall_score: number;
  decision_status: "Selected" | "Rejected" | "Hold";
  feedback_notes: string;
  interviewer_comments: string;
  interview_timestamp: Date;
  history?: Array<{
    ratings: {
      technical_knowledge: number;
      communication_skills: number;
      problem_solving: number;
      confidence: number;
      overall_performance: number;
    };
    overall_score: number;
    decision_status: "Selected" | "Rejected" | "Hold";
    feedback_notes: string;
    interviewer_comments: string;
    timestamp: Date;
  }>;
  created_at: Date;
  updated_at: Date;
}

const interviewSchema = new Schema<IInterview>(
  {
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interviewer_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratings: {
      technical_knowledge: { type: Number, required: true, min: 1, max: 10 },
      communication_skills: { type: Number, required: true, min: 1, max: 10 },
      problem_solving: { type: Number, required: true, min: 1, max: 10 },
      confidence: { type: Number, required: true, min: 1, max: 10 },
      overall_performance: { type: Number, required: true, min: 1, max: 10 },
    },
    overall_score: {
      type: Number,
      required: true,
    },
    decision_status: {
      type: String,
      enum: ["Selected", "Rejected", "Hold"],
      required: true,
    },
    feedback_notes: {
      type: String,
      default: "",
    },
    interviewer_comments: {
      type: String,
      default: "",
    },
    interview_timestamp: {
      type: Date,
      default: () => new Date(),
    },
    history: {
      type: Array,
      default: [],
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

interviewSchema.index({ candidate_id: 1 });
interviewSchema.index({ interviewer_id: 1 });

export default mongoose.model<IInterview>("Interview", interviewSchema);
