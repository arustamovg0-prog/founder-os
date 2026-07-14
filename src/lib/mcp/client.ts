import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class CodebaseMemoryClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor() {
    this.client = new Client(
      {
        name: "founder-os-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async connect() {
    if (this.transport) return;
    
    this.transport = new StdioClientTransport({
      command: "codebase-memory-mcp", // Assuming the binary is in PATH
      args: [],
    });

    await this.client.connect(this.transport);
    console.log("Connected to codebase-memory-mcp");
  }

  async disconnect() {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  async callTool(name: string, args: any) {
    if (!this.transport) {
      await this.connect();
    }
    
    return await this.client.callTool({
      name,
      arguments: args,
    });
  }

  async indexRepository(repoPath: string) {
    return this.callTool("index_repository", { repo_path: repoPath });
  }

  async getArchitecture(projectName: string) {
    return this.callTool("get_architecture", { project: projectName });
  }
}

// Singleton instance
export const codebaseMemory = new CodebaseMemoryClient();
