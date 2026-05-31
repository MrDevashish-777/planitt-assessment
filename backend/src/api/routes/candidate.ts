import { Router } from "express";
import { saveGoogleFormCandidate } from "../controllers/candidate.controller";

const router = Router();

router.post("/google-form", saveGoogleFormCandidate);

export default router;
