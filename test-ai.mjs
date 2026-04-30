import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing with API Key (start):", apiKey?.substring(0, 8) + "...");

if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
  try {
    console.log("Sending test request to Gemini...");
    const result = await model.generateContent("Ahoj, si tam? Odpovedz len 'Áno'.");
    const response = await result.response;
    console.log("SUCCESS! Response:", response.text());
  } catch (error) {
    console.error("FAILED! Error details:");
    console.error(error);
  }
}

test();
