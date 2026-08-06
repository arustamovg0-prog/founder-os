import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Parse arguments
const args = process.argv.slice(2);
const TARGET_FILE = args[0];

if (!TARGET_FILE) {
  console.error("Please provide a target file.");
  process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is missing in env. Run with GEMINI_API_KEY=... tsx ...");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { temperature: 0.1 } });

async function refactorFile(filePath: string) {
  console.log(`Refactoring ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if already heavily using next-intl
  if (content.includes("useTranslations") && content.split("useTranslations").length > 3) {
    console.log("File already translated.");
    return;
  }

  const prompt = `
You are an expert React developer. Your task is to refactor a Next.js App Router component to use \`next-intl\` for internationalization.

File path: ${filePath}

Instructions:
1. Identify all hardcoded user-facing strings (English text in JSX, placeholders, alerts, labels, etc.).
2. Replace them with \`t('camelCaseKey')\`. If there are multiple namespaces, just use one main namespace for this file, e.g., \`const t = useTranslations('NamespaceName');\`.
3. Add \`import { useTranslations } from 'next-intl';\` at the top if it's missing.
4. Extract the translation keys and values into a JSON object under the chosen namespace.
5. You MUST return a JSON object with EXACTLY two keys: 
   - "code": a string containing the fully refactored file content.
   - "translations": an object representing the English translations.

ONLY return the valid JSON object. Do not include markdown formatting or backticks around the JSON.

Original Code:
${content}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith("\`\`\`json")) {
        text = text.substring(7);
    }
    if (text.startsWith("\`\`\`")) {
        text = text.substring(3);
    }
    if (text.endsWith("\`\`\`")) {
        text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const parsed = JSON.parse(text);
    
    if (parsed.code && parsed.translations) {
      fs.writeFileSync(filePath, parsed.code);
      
      const enPath = path.resolve('messages/en.json');
      const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
      
      // Merge translations
      for (const [namespace, keys] of Object.entries(parsed.translations)) {
        if (!enData[namespace]) enData[namespace] = {};
        enData[namespace] = { ...enData[namespace], ...(keys as object) };
      }
      
      fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
      console.log(`Successfully refactored ${filePath} and updated en.json.`);
    } else {
      console.log("Invalid response format.");
    }
  } catch (err) {
    console.error(`Failed on ${filePath}`, err);
  }
}

refactorFile(TARGET_FILE);
