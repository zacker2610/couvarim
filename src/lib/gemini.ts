import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using flash for speed/cost
export const geminiVisionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Vision is built-in now
