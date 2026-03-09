import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";
import cloudinary from "cloudinary";

console.log("🤖 Groq AI initialized");

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server listening at port ${PORT}`);
});