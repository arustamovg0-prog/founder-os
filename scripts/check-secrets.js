const fs = require('fs');
const path = require('path');

const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.development'];
const FORBIDDEN_KEYWORDS = ['OPENAI', 'ANTHROPIC', 'GEMINI', 'SECRET', 'PASSWORD', 'SERVICE_ACCOUNT'];

let hasError = false;

ENV_FILES.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check if line exposes a variable to the frontend
    if (line.trim().startsWith('NEXT_PUBLIC_')) {
      const [key, ...rest] = line.split('=');
      if (!key || rest.length === 0) return;

      const upperKey = key.toUpperCase();
      
      // We allow FIREBASE configuration because it's required for the client SDK
      if (upperKey.includes('FIREBASE')) return;

      FORBIDDEN_KEYWORDS.forEach((keyword) => {
        if (upperKey.includes(keyword)) {
          console.error(`🚨 SECURITY VULNERABILITY FOUND! 🚨`);
          console.error(`File: ${file} (Line ${index + 1})`);
          console.error(`Exposed sensitive key to frontend: ${key}`);
          console.error(`AI Tools / Backend secrets must NOT start with NEXT_PUBLIC_.`);
          hasError = true;
        }
      });
    }
  });
});

if (hasError) {
  console.error('Build failed due to exposed secrets.');
  process.exit(1);
} else {
  console.log('✅ Security check passed. No exposed secrets found in NEXT_PUBLIC_ variables.');
}
