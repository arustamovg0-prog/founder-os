import fs from 'fs';
import path from 'path';

export interface Persona {
  id: string;
  division: string;
  content: string;
}

export class PromptManager {
  private static personasDir = path.join(process.cwd(), 'src/lib/agents/personas');

  /**
   * Get a specific persona by division and id (filename without .md).
   */
  static getPersona(division: string, id: string): Persona | null {
    try {
      const filePath = path.join(this.personasDir, division, `${id}.md`);
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        id,
        division,
        content,
      };
    } catch (error) {
      console.error(`Failed to load persona ${division}/${id}:`, error);
      return null;
    }
  }

  /**
   * List all available personas in a division.
   */
  static listPersonas(division: string): string[] {
    try {
      const dirPath = path.join(this.personasDir, division);
      const files = fs.readdirSync(dirPath);
      return files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    } catch (error) {
      console.error(`Failed to list personas in ${division}:`, error);
      return [];
    }
  }

  /**
   * Build a system prompt by combining base instructions with a persona.
   */
  static buildSystemPrompt(personaContent: string, additionalContext: string = ''): string {
    return `
You are an AI assistant acting under the following persona and guidelines:

--- PERSONA START ---
${personaContent}
--- PERSONA END ---

--- ADDITIONAL CONTEXT ---
${additionalContext}

Always stay in character and provide helpful, structured, and insightful answers.
    `.trim();
  }
}
