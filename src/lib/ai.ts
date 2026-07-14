import { getApp } from 'firebase/app';
// Depending on the exact Firebase version, AI Logic might be in a preview package or main package.
// @ts-expect-error using for mock data - Module might not be available until npx firebase-tools init ailogic
import { getVertexAI, getGenerativeModel } from 'firebase/vertexai';
import app from './firebase';

// Initialize the Vertex AI service (Gemini)
// Note: In a real app, ensure you have initialized Firebase first.
let vertexAI;
try {
  vertexAI = getVertexAI(app);
} catch (e) {
  console.warn('Vertex AI not initialized. Ensure firebase/vertexai-preview is installed and configured.', e);
}

// Initialize the model (using Gemini Developer API)
export const geminiModel = vertexAI ? getGenerativeModel(vertexAI, { model: 'gemini-2.5-flash' }) : null;

export async function analyzePitchDeck(summary: string) {
  if (!geminiModel) throw new Error('AI Model not initialized');
  
  const prompt = `
    You are an expert VC investor. Analyze the following pitch deck summary:
    "${summary}"
    
    Provide a JSON response with the following schema:
    {
      "aiSummary": "A concise 2-sentence summary of the startup",
      "aiStrengths": ["strength 1", "strength 2", "strength 3"],
      "aiWeaknesses": ["weakness 1", "weakness 2", "weakness 3"]
    }
  `;
  
  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text();
  
  try {
    // In production, use structured outputs (responseMimeType: 'application/json')
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response', error);
    throw error;
  }
}
