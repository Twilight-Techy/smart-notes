import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use Pro model for detailed analysis (summarization, concept extraction)
export const proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Use Flash model for fast chat interactions
export const flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
