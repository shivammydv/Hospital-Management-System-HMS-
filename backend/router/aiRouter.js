import express from "express";
import { chatAI } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chatAI);

export default router;