import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

if (!API_KEY) {
    console.warn("Gemini API Key is missing!");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const textModel = genAI.getGenerativeModel({ model: "gemini-pro" });
export const visionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
