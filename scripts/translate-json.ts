import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is missing in env.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { temperature: 0.1 } });

async function translateJson() {
  const enPath = path.resolve('messages/en.json');
  const ruPath = path.resolve('messages/ru.json');
  const uzPath = path.resolve('messages/uz.json');

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const ruData = fs.existsSync(ruPath) ? JSON.parse(fs.readFileSync(ruPath, 'utf-8')) : {};
  const uzData = fs.existsSync(uzPath) ? JSON.parse(fs.readFileSync(uzPath, 'utf-8')) : {};

  // Find missing keys
  const missingRu: Record<string, Record<string, string>> = {};
  const missingUz: Record<string, Record<string, string>> = {};

  for (const [namespace, keys] of Object.entries(enData)) {
    if (typeof keys !== 'object' || keys === null) continue;
    
    for (const [key, value] of Object.entries(keys as Record<string, string>)) {
      if (!ruData[namespace] || !ruData[namespace][key]) {
        if (!missingRu[namespace]) missingRu[namespace] = {};
        missingRu[namespace][key] = value;
      }
      if (!uzData[namespace] || !uzData[namespace][key]) {
        if (!missingUz[namespace]) missingUz[namespace] = {};
        missingUz[namespace][key] = value;
      }
    }
  }

  if (Object.keys(missingRu).length > 0) {
    console.log("Translating to Russian...");
    const promptRu = `
You are a professional translator for a B2B startup and investor ecosystem platform.
Translate the following JSON structure from English to Russian. 
Return ONLY the translated JSON structure.

JSON:
${JSON.stringify(missingRu, null, 2)}
`;
    try {
      const result = await model.generateContent(promptRu);
      let text = result.response.text().trim();
      if (text.startsWith("\`\`\`json")) text = text.substring(7);
      if (text.startsWith("\`\`\`")) text = text.substring(3);
      if (text.endsWith("\`\`\`")) text = text.substring(0, text.length - 3);
      
      const translatedRu = JSON.parse(text.trim());
      
      for (const [namespace, keys] of Object.entries(translatedRu)) {
        if (!ruData[namespace]) ruData[namespace] = {};
        ruData[namespace] = { ...ruData[namespace], ...(keys as object) };
      }
      fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2));
      console.log("Russian translation updated.");
    } catch (e) {
      console.error("Failed to translate RU:", e);
    }
  } else {
    console.log("No missing Russian translations.");
  }

  if (Object.keys(missingUz).length > 0) {
    console.log("Translating to Uzbek...");
    const promptUz = `
You are a professional translator for a B2B startup and investor ecosystem platform.
Translate the following JSON structure from English to Uzbek (Latin script).
Return ONLY the translated JSON structure.

JSON:
${JSON.stringify(missingUz, null, 2)}
`;
    try {
      const result = await model.generateContent(promptUz);
      let text = result.response.text().trim();
      if (text.startsWith("\`\`\`json")) text = text.substring(7);
      if (text.startsWith("\`\`\`")) text = text.substring(3);
      if (text.endsWith("\`\`\`")) text = text.substring(0, text.length - 3);
      
      const translatedUz = JSON.parse(text.trim());
      
      for (const [namespace, keys] of Object.entries(translatedUz)) {
        if (!uzData[namespace]) uzData[namespace] = {};
        uzData[namespace] = { ...uzData[namespace], ...(keys as object) };
      }
      fs.writeFileSync(uzPath, JSON.stringify(uzData, null, 2));
      console.log("Uzbek translation updated.");
    } catch (e) {
      console.error("Failed to translate UZ:", e);
    }
  } else {
    console.log("No missing Uzbek translations.");
  }
}

translateJson();
