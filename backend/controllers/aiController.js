import { askAI } from "../services/aiService.js";

export const chatAI = async (req, res) => {

  try {

    const { message } = req.body;
    const userId = req.user ? req.user._id.toString() : 'anonymous';

    console.log("User message:", message, "User ID:", userId);

    const reply = await askAI(message, userId);

    res.json({
      success: true,
      reply
    });

  } catch (error) {

    console.error("Groq error:", error.message);

    res.status(500).json({
      success: false,
      message: "AI assistant error",
      error: error.message
    });

  }

};