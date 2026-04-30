import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" }); 
export const geminiVisionModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" }); 
