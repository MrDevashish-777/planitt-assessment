import { Request, Response } from "express";
import config from "../../config";
import User from "../../models/User";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firstString(value: unknown): string {
  if (Array.isArray(value)) {
    return firstString(value[0]);
  }
  if (value === null || typeof value === "undefined") {
    return "";
  }
  return String(value).trim();
}

function pickField(body: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = firstString(body[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

export async function saveGoogleFormCandidate(req: Request, res: Response) {
  try {
    if (config.GOOGLE_FORM_WEBHOOK_SECRET) {
      const receivedSecret = firstString(req.get("x-google-form-secret"));
      if (receivedSecret !== config.GOOGLE_FORM_WEBHOOK_SECRET) {
        return res.status(401).json({ message: "Invalid webhook secret" });
      }
    }

    const body = req.body as Record<string, unknown>;
    const email = pickField(body, ["email", "Email"]).toLowerCase();
    const fullName = pickField(body, ["full_name", "name", "Name"]);

    if (!fullName) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const update = {
      email,
      full_name: fullName,
      phone: pickField(body, ["phone", "phone_no", "Phone", "Phone Number"]),
      address: pickField(body, ["address", "Address"]),
      resume_url: pickField(body, ["resume", "resume_url", "Resume", "Resume Link"]),
      about: pickField(body, ["about", "about_yourself", "About", "About Yourself"]),
      role: "CANDIDATE" as const,
      source: "GOOGLE_FORM" as const,
      form_submitted_at: new Date(),
    };

    const candidate = await User.findOneAndUpdate(
      { email },
      {
        $set: update,
        $setOnInsert: { password_hash: "candidate_placeholder" },
      },
      { new: true, upsert: true, runValidators: true }
    ).select("_id email full_name");

    res.status(201).json({
      message: "Candidate form response saved",
      candidateId: candidate._id,
    });
  } catch (error) {
    console.error("Google form candidate save error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
