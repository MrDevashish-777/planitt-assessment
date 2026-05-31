import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: "4h",

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_SECURE: process.env.NODE_ENV === "production",
  CORS_ORIGIN:
    process.env.CORS_ORIGIN ||
    "https://planitt-assessment.onrender.com,https://test.planitt.in",
  ADMIN_SHARED_PASSWORD: process.env.ADMIN_SHARED_PASSWORD || "",
  GOOGLE_FORM_WEBHOOK_SECRET: process.env.GOOGLE_FORM_WEBHOOK_SECRET || "",
};

export default config;
